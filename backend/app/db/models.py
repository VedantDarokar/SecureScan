import enum
from datetime import datetime
from typing import Optional, List, Dict, Any

class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class VulnerabilitySeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Informational"

def format_user_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to sanitize MongoDB User document for API responses."""
    if not doc:
        return {}
    return {
        "id": doc.get("id") or 1,
        "email": doc.get("email"),
        "full_name": doc.get("full_name"),
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at") or datetime.utcnow()
    }

def format_scan_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to sanitize MongoDB Scan document for API responses."""
    if not doc:
        return {}
    
    # Format embedded vulnerabilities
    vulns = []
    for v in doc.get("vulnerabilities", []):
        rem = v.get("remediation")
        rem_formatted = None
        if rem:
            rem_formatted = {
                "id": rem.get("id") or v.get("id") or 1,
                "plain_explanation": rem.get("plain_explanation", ""),
                "patch_code": rem.get("patch_code", ""),
                "patch_language": rem.get("patch_language", "python"),
                "created_at": rem.get("created_at") or datetime.utcnow()
            }
        
        vulns.append({
            "id": v.get("id") or 1,
            "alert_title": v.get("alert_title", "Vulnerability Detected"),
            "severity": v.get("severity", "Low"),
            "confidence": v.get("confidence", "Medium"),
            "cwe_id": str(v.get("cwe_id", "")),
            "wasc_id": str(v.get("wasc_id", "")),
            "url": v.get("url", ""),
            "param": v.get("param", ""),
            "attack": v.get("attack", ""),
            "description": v.get("description", ""),
            "solution": v.get("solution", ""),
            "reference": v.get("reference", ""),
            "remediation": rem_formatted
        })

    return {
        "id": int(doc.get("id", 1)),
        "target_url": doc.get("target_url", ""),
        "status": doc.get("status", ScanStatus.PENDING),
        "progress": int(doc.get("progress", 0)),
        "risk_score": float(doc.get("risk_score", 0.0)),
        "total_vulnerabilities": int(doc.get("total_vulnerabilities", 0)),
        "critical_count": int(doc.get("critical_count", 0)),
        "high_count": int(doc.get("high_count", 0)),
        "medium_count": int(doc.get("medium_count", 0)),
        "low_count": int(doc.get("low_count", 0)),
        "error_message": doc.get("error_message"),
        "created_at": doc.get("created_at") or datetime.utcnow(),
        "completed_at": doc.get("completed_at"),
        "vulnerabilities": vulns
    }
