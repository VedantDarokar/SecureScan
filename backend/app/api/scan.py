import logging
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from app.db.mongo import scans_col, get_next_id
from app.db.models import ScanStatus, format_scan_doc
from app.schemas.scan import ScanCreate, ScanOut, ScanSummary
from app.api.auth import get_current_user
from app.tasks.celery_worker import run_scan_task, execute_scan_pipeline
from app.scanner.report_generator import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scans", tags=["Scans"])

def validate_url(url: str) -> str:
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "http://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid target URL provided.")
    return url

@router.post("", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
def create_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    target_url = validate_url(scan_in.target_url)
    scan_id = get_next_id("scans")

    scan_doc = {
        "id": scan_id,
        "target_url": target_url,
        "user_id": current_user.get("id"),
        "status": ScanStatus.PENDING,
        "progress": 0,
        "risk_score": 0.0,
        "total_vulnerabilities": 0,
        "critical_count": 0,
        "high_count": 0,
        "medium_count": 0,
        "low_count": 0,
        "error_message": None,
        "created_at": datetime.utcnow(),
        "completed_at": None,
        "vulnerabilities": []
    }
    scans_col.insert_one(scan_doc)

    # Fast socket check: if Redis is online, dispatch via Celery; otherwise execute via local BackgroundTasks
    dispatched_to_celery = False
    try:
        import socket
        s = socket.create_connection(("localhost", 6379), timeout=0.15)
        s.close()
        run_scan_task.delay(scan_id)
        dispatched_to_celery = True
        logger.info(f"Scan {scan_id} queued via Celery worker.")
    except Exception:
        pass

    if not dispatched_to_celery:
        background_tasks.add_task(execute_scan_pipeline, scan_id)
        logger.info(f"Scan {scan_id} dispatched via local FastAPI background thread.")

    return format_scan_doc(scan_doc)

@router.get("", response_model=List[ScanSummary])
def list_scans(
    skip: int = 0,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    filter_query = {"user_id": current_user.get("id")}

    cursor = scans_col.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
    summaries = []
    for doc in cursor:
        summaries.append({
            "id": doc.get("id", 1),
            "target_url": doc.get("target_url", ""),
            "status": doc.get("status", ScanStatus.PENDING),
            "progress": int(doc.get("progress", 0)),
            "risk_score": float(doc.get("risk_score", 0.0)),
            "total_vulnerabilities": int(doc.get("total_vulnerabilities", 0)),
            "created_at": doc.get("created_at") or datetime.utcnow()
        })
    return summaries

@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int):
    scan = scans_col.find_one({"id": int(scan_id)})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return format_scan_doc(scan)

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(scan_id: int):
    result = scans_col.delete_one({"id": int(scan_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return None

@router.post("/{scan_id}/remediate", response_model=ScanOut)
def remediate_scan(scan_id: int):
    """Triggers LangChain + Gemini AI remediation for all vulnerabilities in a MongoDB scan."""
    scan = scans_col.find_one({"id": int(scan_id)})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    from app.ai.remediation_service import generate_remediations_for_scan
    generate_remediations_for_scan(scan_id)
    refreshed = scans_col.find_one({"id": int(scan_id)})
    return format_scan_doc(refreshed)

@router.post("/vulnerabilities/{vuln_id}/remediate")
def remediate_single_vulnerability(vuln_id: int, scan_id: Optional[int] = 1):
    """Triggers LangChain + Gemini AI remediation for a specific vulnerability."""
    from app.ai.remediation_service import generate_remediation_for_vulnerability
    rem = generate_remediation_for_vulnerability(scan_id=scan_id, vuln_id=vuln_id)
    if not rem:
        raise HTTPException(status_code=404, detail="Vulnerability not found.")
    return rem

@router.get("/{scan_id}/report")
def download_pdf_report(scan_id: int):
    """Generates and downloads a comprehensive PDF security assessment report from MongoDB."""
    scan = scans_col.find_one({"id": int(scan_id)})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    pdf_buffer = generate_pdf_report(scan)
    filename = f"SecScan_Report_Scan_{scan.get('id', scan_id)}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
