# Story: Multi-Format Ingestion API

## Completed Tasks
- **Task**: Define strict Pydantic schemas for the file upload payloads and upload status responses (`app/schemas/upload.py`).
- **Task 1**: Build a `POST /upload` endpoint accepting `multipart/form-data` for PDF, Markdown, TXT, DOCX, CSV, and JSON files (`app/api/v1/endpoints/upload.py`).
- **Task 2**: Implement FastAPI background tasks (`BackgroundTasks`) to immediately return an `upload_id` to the frontend while the document processes asynchronously (`app/services/ingestion_service.py`).
- **Task 3**: Build a `GET /upload/{upload_id}/status` polling endpoint for the frontend to check processing state (`app/api/v1/endpoints/upload.py`).
- **Acceptance Criteria**: A 50MB PDF can be uploaded without timing out the connection, immediately returning a tracking ID.

---

## API Structure

### 1. `POST /upload` (and `/api/v1/upload`)
- **What it does**: Accepts `multipart/form-data` containing document files up to 100MB. Streams chunks directly to disk in 1MB increments to prevent memory spikes or HTTP timeouts. Queues an asynchronous ingestion task via FastAPI `BackgroundTasks` and immediately returns HTTP 202 Accepted with a tracking `upload_id`.
- **Supported Formats**: `.pdf`, `.md`, `.txt`, `.docx`, `.csv`, `.json`.

#### Output Format (JSON)
- **Schema**: `FileUploadResponse` (defined in `app/schemas/upload.py`)
```json
{
  "upload_id": "40adce2f-bcad-43b9-897b-3d606138f5f6",
  "filename": "annual_research_report.pdf",
  "file_type": "pdf",
  "file_size_bytes": 52428800,
  "status": "pending",
  "message": "Document uploaded successfully. Asynchronous indexing initiated.",
  "created_at": "2026-10-18T20:25:00.000000Z"
}
```

---

### 2. `GET /upload/{upload_id}/status` (and `/api/v1/upload/{upload_id}/status`)
- **What it does**: Polling endpoint that returns the real-time processing status, progress percentage, chunk counts, extracted character metrics, and failure diagnostics.

#### Output Format (JSON)
- **Schema**: `UploadStatusResponse` (defined in `app/schemas/upload.py`)
```json
{
  "upload_id": "40adce2f-bcad-43b9-897b-3d606138f5f6",
  "filename": "annual_research_report.pdf",
  "file_type": "pdf",
  "file_size_bytes": 52428800,
  "status": "completed",
  "progress": 100.0,
  "chunks_count": 842,
  "extracted_chars": 421000,
  "error": null,
  "metadata": {
    "format": "pdf",
    "page_count": 52,
    "extracted_blocks": 340
  },
  "created_at": "2026-10-18T20:25:00.000000Z",
  "updated_at": "2026-10-18T20:25:03.000000Z",
  "completed_at": "2026-10-18T20:25:03.000000Z"
}
```

---

## Implementation Details

1. **Strict Pydantic Validation**:
   - `UploadStatus` enum (`pending`, `processing`, `completed`, `failed`).
   - `SupportedFileType` enum and validation against canonical extension lists and MIME types.
   - Rejects unaccepted file extensions with HTTP 400 Bad Request.

2. **Zero-Timeout 50MB+ Streaming Intake**:
   - Implemented `ingestion_service.stage_file_stream` which reads input streams in 1MB chunks to disk.
   - Maintains low, constant memory utilization, allowing 50MB+ uploads to complete in sub-seconds and return a tracking UUID immediately.

3. **Multi-Format Extraction Pipeline**:
   - **PDF**: Pure Python binary stream decompression (`zlib.decompress`) and text operand token extraction (`Tj` / `TJ`).
   - **DOCX**: Native standard library `zipfile` extraction and XML DOM traversal of `<w:t>` and `<w:p>` nodes.
   - **CSV**: Dialect detection and row-level tabular extraction.
   - **JSON**: Hierarchical traversal and formatted schema serialization.
   - **Markdown & TXT**: Multi-encoding fallback with heading and paragraph boundary chunking.
