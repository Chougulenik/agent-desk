import email
import logging
import os
import re
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import JSONResponse

from app.schemas.upload import (
    ALLOWED_EXTENSIONS,
    FileUploadResponse,
    UploadListResponse,
    UploadStatus,
    UploadStatusResponse,
)
from app.services.ingestion_service import ingestion_service

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB max file size (supports 50MB+ acceptance criteria)


async def _parse_raw_multipart_fallback(request: Request) -> tuple[str, str, bytes]:
    """
    Fallback parser for multipart/form-data directly from ASGI body stream.
    Used when python-multipart package is not yet installed in the active environment.
    """
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content-Type must be 'multipart/form-data'.",
        )

    # Extract boundary
    boundary_match = re.search(r"boundary=([^;]+)", content_type)
    if not boundary_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed multipart request: missing boundary.",
        )
    boundary = boundary_match.group(1).strip().strip('"').encode("ascii")

    # Read stream chunks
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
            )

    # Split parts by boundary
    delimiter = b"--" + boundary
    parts = body.split(delimiter)

    for part in parts:
        if b"Content-Disposition:" in part and b'filename="' in part:
            header_section, _, file_data = part.partition(b"\r\n\r\n")
            # Strip trailing CRLF
            if file_data.endswith(b"\r\n"):
                file_data = file_data[:-2]

            # Extract filename
            fn_match = re.search(rb'filename="([^"]+)"', header_section)
            filename = fn_match.group(1).decode("utf-8", errors="replace") if fn_match else "uploaded_file"

            # Extract part Content-Type
            ct_match = re.search(rb"Content-Type:\s*([^\r\n]+)", header_section, re.IGNORECASE)
            part_content_type = ct_match.group(1).decode("ascii").strip() if ct_match else "application/octet-stream"

            return filename, part_content_type, bytes(file_data)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No file part found in multipart payload.",
    )


@router.post(
    "",
    response_model=FileUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload multi-format document",
    description="Accepts multipart/form-data for PDF, Markdown, TXT, DOCX, CSV, and JSON files up to 100MB. Immediately returns upload_id.",
)
@router.post(
    "/",
    response_model=FileUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    include_in_schema=False,
)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
) -> FileUploadResponse:
    """
    POST /upload endpoint.
    Streams document to staging storage and immediately dispatches background task.
    """
    upload_id = str(uuid.uuid4())
    filename = ""
    content_type = ""
    file_obj = None

    try:
        # Check if standard FastAPI UploadFile was parsed
        if file is not None and file.filename:
            filename = file.filename
            content_type = file.content_type or ""
            file_obj = file
        else:
            # Fallback for environments where python-multipart is loading or raw stream is sent
            fn, ct, data = await _parse_raw_multipart_fallback(request)
            filename = fn
            content_type = ct
            file_obj = io.BytesIO(data)

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Error accessing form data: %s. Attempting raw fallback.", exc)
        fn, ct, data = await _parse_raw_multipart_fallback(request)
        filename = fn
        content_type = ct
        file_obj = io.BytesIO(data)

    # Strict file extension and content-type validation
    try:
        ext, normalized_type = ingestion_service.validate_file(filename, content_type)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # Stream file to staging storage (1MB chunks to ensure zero timeouts for 50MB+ files)
    try:
        file_path, file_size = await ingestion_service.stage_file_stream(
            upload_id=upload_id,
            filename=filename,
            stream_or_file=file_obj,
        )
    except Exception as exc:
        logger.error("Failed to stage uploaded file: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stage file for processing: {str(exc)}",
        )

    # Register initial job record in state store
    record = ingestion_service.create_record(
        upload_id=upload_id,
        filename=filename,
        file_type=normalized_type,
        file_size_bytes=file_size,
        file_path=file_path,
    )

    # Enqueue asynchronous document processing in BackgroundTasks
    background_tasks.add_task(ingestion_service.process_document_task, upload_id)

    logger.info("Enqueued ingestion background task for upload_id=%s, file=%s", upload_id, filename)

    return FileUploadResponse(
        upload_id=upload_id,
        filename=filename,
        file_type=normalized_type,
        file_size_bytes=file_size,
        status=UploadStatus.PENDING,
        message="Document uploaded successfully. Asynchronous indexing initiated.",
        created_at=record.created_at,
    )


@router.get(
    "/{upload_id}/status",
    response_model=UploadStatusResponse,
    summary="Get upload processing status",
    description="Polling endpoint to check real-time state, progress, and chunk indexing metrics.",
)
async def get_upload_status(upload_id: str) -> UploadStatusResponse:
    """
    GET /upload/{upload_id}/status polling endpoint.
    """
    record = ingestion_service.get_record(upload_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload job with ID '{upload_id}' not found.",
        )

    return record.to_status_response()


@router.get(
    "",
    response_model=UploadListResponse,
    summary="List all uploaded documents",
    description="Returns all uploaded documents and their current processing status.",
)
async def list_uploads() -> UploadListResponse:
    """
    GET /upload endpoint to list all uploads.
    """
    records = ingestion_service.list_records()
    items = [r.to_status_response() for r in records]
    return UploadListResponse(items=items, total=len(items))


@router.get(
    "/{upload_id}/chunks",
    summary="Get extracted document chunks",
    description="Retrieves the generated text chunks for an uploaded document once processing is complete.",
)
async def get_upload_chunks(upload_id: str):
    """
    GET /upload/{upload_id}/chunks endpoint for inspection and RAG indexing.
    """
    record = ingestion_service.get_record(upload_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload job with ID '{upload_id}' not found.",
        )

    if record.status != UploadStatus.COMPLETED:
        return {
            "upload_id": upload_id,
            "status": record.status,
            "message": "Chunks are not ready yet. Current status: " + record.status.value,
            "chunks": [],
        }

    return {
        "upload_id": upload_id,
        "filename": record.filename,
        "chunks_count": len(record.chunks),
        "chunks": record.chunks,
    }
