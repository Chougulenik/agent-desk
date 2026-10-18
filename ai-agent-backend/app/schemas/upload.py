from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UploadStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SupportedFileType(str, Enum):
    PDF = "pdf"
    MARKDOWN = "md"
    TXT = "txt"
    DOCX = "docx"
    CSV = "csv"
    JSON = "json"


# Canonical mapping for allowed extensions
ALLOWED_EXTENSIONS: set[str] = {".pdf", ".md", ".txt", ".docx", ".csv", ".json"}

# Accepted Content-Type / MIME types
ALLOWED_MIME_TYPES: set[str] = {
    # PDF
    "application/pdf",
    # Markdown
    "text/markdown",
    "text/x-markdown",
    # Plain text
    "text/plain",
    # DOCX
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    # CSV
    "text/csv",
    "application/csv",
    # JSON
    "application/json",
    "text/json",
    # Generic binary fallback often sent by OS/browsers for docx or unrecognized
    "application/octet-stream",
}


def get_file_extension(filename: str) -> str:
    """Extract lowercased extension with leading dot."""
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def normalize_file_type(filename: str) -> str:
    """Normalize file extension to SupportedFileType enum value."""
    ext = get_file_extension(filename).lstrip(".")
    if ext == "markdown":
        return SupportedFileType.MARKDOWN.value
    return ext


class FileUploadResponse(BaseModel):
    """
    Schema returned immediately upon successful file upload intake.
    """
    model_config = ConfigDict(from_attributes=True)

    upload_id: str = Field(
        ...,
        description="Unique UUID tracking ID for the uploaded document",
        examples=["9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"],
    )
    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Sanitized original filename of the uploaded file",
        examples=["report.pdf"],
    )
    file_type: str = Field(
        ...,
        description="Standardized file extension / format",
        examples=["pdf"],
    )
    file_size_bytes: int = Field(
        ...,
        ge=0,
        description="Total size of the file in bytes",
        examples=[52428800],
    )
    status: UploadStatus = Field(
        default=UploadStatus.PENDING,
        description="Initial lifecycle status of document processing",
        examples=[UploadStatus.PENDING],
    )
    message: str = Field(
        default="File uploaded successfully. Document ingestion initiated in background.",
        description="Informational intake status message",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the upload request was accepted",
    )


class UploadStatusResponse(BaseModel):
    """
    Schema returned by the GET /upload/{upload_id}/status polling endpoint.
    """
    model_config = ConfigDict(from_attributes=True)

    upload_id: str = Field(
        ...,
        description="Unique UUID tracking ID for the upload job",
    )
    filename: str = Field(
        ...,
        description="Original name of the uploaded document",
    )
    file_type: str = Field(
        ...,
        description="Format of the uploaded document",
    )
    file_size_bytes: int = Field(
        ...,
        ge=0,
        description="Size of the document in bytes",
    )
    status: UploadStatus = Field(
        ...,
        description="Current status of the document processing pipeline",
    )
    progress: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Ingestion progress percentage from 0.0 to 100.0",
        examples=[45.0],
    )
    chunks_count: Optional[int] = Field(
        default=None,
        ge=0,
        description="Number of indexed chunks generated upon completion",
    )
    extracted_chars: Optional[int] = Field(
        default=None,
        ge=0,
        description="Total character count extracted from the document",
    )
    error: Optional[str] = Field(
        default=None,
        description="Detailed failure message if processing failed",
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Document specific metadata (e.g. page counts, line counts, rows)",
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when document was queued",
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp of the most recent status transition",
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when ingestion reached terminal state (completed or failed)",
    )


class UploadListResponse(BaseModel):
    """
    Schema for listing all tracked document ingestion jobs.
    """
    items: List[UploadStatusResponse] = Field(
        default_factory=list,
        description="List of upload jobs and their current processing statuses",
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total number of registered upload jobs",
    )
