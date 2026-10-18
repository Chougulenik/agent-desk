import asyncio
import io
import json
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.upload import UploadStatus

client = TestClient(app)


def test_upload_txt_success():
    """Test uploading a TXT file and polling status."""
    content = b"AgentDesk is an intelligent AI workspace with multi-format ingestion."
    response = client.post(
        "/upload",
        files={"file": ("notes.txt", content, "text/plain")},
    )
    assert response.status_code == 202
    data = response.json()
    assert "upload_id" in data
    assert data["filename"] == "notes.txt"
    assert data["file_type"] == "txt"
    assert data["status"] in ("pending", "processing", "completed")

    upload_id = data["upload_id"]

    # Poll status
    status_resp = client.get(f"/upload/{upload_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["upload_id"] == upload_id
    assert status_data["filename"] == "notes.txt"


def test_upload_markdown_success():
    """Test uploading a Markdown file."""
    md_content = b"# Architecture Overview\n\n- Subsystem A\n- Subsystem B\n\n```python\nprint('AgentDesk')\n```"
    response = client.post(
        "/api/v1/upload",
        files={"file": ("architecture.md", md_content, "text/markdown")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["file_type"] == "md"
    upload_id = data["upload_id"]

    status_resp = client.get(f"/api/v1/upload/{upload_id}/status")
    assert status_resp.status_code == 200


def test_upload_csv_success():
    """Test uploading a CSV file."""
    csv_content = b"id,name,role\n1,Alice,Engineer\n2,Bob,Researcher\n3,Charlie,Architect\n"
    response = client.post(
        "/upload",
        files={"file": ("team.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["file_type"] == "csv"


def test_upload_json_success():
    """Test uploading a JSON file."""
    json_data = json.dumps({"project": "AgentDesk", "version": "1.0", "active": True}).encode("utf-8")
    response = client.post(
        "/upload",
        files={"file": ("config.json", json_data, "application/json")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["file_type"] == "json"


def test_upload_docx_success():
    """Test uploading a valid mock DOCX file (zip containing word/document.xml)."""
    docx_buffer = io.BytesIO()
    with zipfile.ZipFile(docx_buffer, "w") as z:
        doc_xml = b"""<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>
                <w:p><w:r><w:t>Hello from AgentDesk DOCX document!</w:t></w:r></w:p>
            </w:body>
        </w:document>"""
        z.writestr("word/document.xml", doc_xml)

    response = client.post(
        "/upload",
        files={"file": ("specs.docx", docx_buffer.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["file_type"] == "docx"


def test_upload_pdf_success():
    """Test uploading a PDF file."""
    pdf_content = (
        b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n(Hello AgentDesk PDF) Tj\nET\nendstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF"
    )
    response = client.post(
        "/upload",
        files={"file": ("whitepaper.pdf", pdf_content, "application/pdf")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["file_type"] == "pdf"


def test_upload_invalid_file_extension():
    """Test rejecting unsupported file extensions with 400 Bad Request."""
    response = client.post(
        "/upload",
        files={"file": ("malware.exe", b"MZ...", "application/octet-stream")},
    )
    assert response.status_code == 400
    error_data = response.json()
    assert "Unsupported file extension" in error_data["detail"]


def test_upload_status_not_found():
    """Test polling for an unknown upload ID returns 404."""
    response = client.get("/upload/non-existent-uuid/status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_simulated_large_file_intake():
    """
    Acceptance Criteria Test:
    Ensures a large (e.g. 50MB simulated stream) file intake completes immediately
    without timing out, and returns a valid tracking ID.
    """
    # 5MB in-memory chunk repeated or sized payload for rapid testing
    simulated_large_content = b"%PDF-1.4\n" + (b"A" * (5 * 1024 * 1024)) + b"\n%%EOF"
    response = client.post(
        "/upload",
        files={"file": ("massive_archive.pdf", simulated_large_content, "application/pdf")},
    )
    assert response.status_code == 202
    data = response.json()
    assert "upload_id" in data
    assert data["file_size_bytes"] == len(simulated_large_content)
    assert data["status"] in ("pending", "processing", "completed")
