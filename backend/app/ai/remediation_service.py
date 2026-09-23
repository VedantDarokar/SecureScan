import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.db.mongo import scans_col
from app.ai.remediation import remediation_pipeline

logger = logging.getLogger(__name__)

def generate_remediation_for_vulnerability(scan_id: int, vuln_id: int) -> Optional[Dict[str, Any]]:
    """Generates and saves AI remediation for a specific vulnerability in a scan document."""
    scan = scans_col.find_one({"id": int(scan_id)})
    if not scan:
        return None

    vulns = scan.get("vulnerabilities", [])
    target_vuln = None
    target_index = -1
    for idx, v in enumerate(vulns):
        if v.get("id") == int(vuln_id):
            target_vuln = v
            target_index = idx
            break

    if not target_vuln:
        return None

    # If already has remediation, return it
    if target_vuln.get("remediation"):
        return target_vuln["remediation"]

    finding_data = {
        "alert_title": target_vuln.get("alert_title"),
        "severity": target_vuln.get("severity", "Medium"),
        "cwe_id": target_vuln.get("cwe_id"),
        "wasc_id": target_vuln.get("wasc_id"),
        "url": target_vuln.get("url"),
        "param": target_vuln.get("param"),
        "attack": target_vuln.get("attack"),
        "description": target_vuln.get("description"),
        "solution": target_vuln.get("solution"),
        "reference": target_vuln.get("reference")
    }

    result = remediation_pipeline.generate_remediation(finding_data)
    rem_doc = {
        "id": int(vuln_id),
        "plain_explanation": result.get("plain_explanation", ""),
        "patch_code": result.get("patch_code", ""),
        "patch_language": result.get("patch_language", "python"),
        "created_at": datetime.utcnow()
    }

    vulns[target_index]["remediation"] = rem_doc
    scans_col.update_one(
        {"id": int(scan_id)},
        {"$set": {"vulnerabilities": vulns}}
    )
    return rem_doc

def generate_remediations_for_scan(scan_id: int) -> List[Dict[str, Any]]:
    """Generates and saves AI remediations for all vulnerabilities in a scan."""
    scan = scans_col.find_one({"id": int(scan_id)})
    if not scan:
        return []

    vulns = scan.get("vulnerabilities", [])
    remediations = []
    updated = False

    for v in vulns:
        if not v.get("remediation"):
            finding_data = {
                "alert_title": v.get("alert_title"),
                "severity": v.get("severity", "Medium"),
                "cwe_id": v.get("cwe_id"),
                "wasc_id": v.get("wasc_id"),
                "url": v.get("url"),
                "param": v.get("param"),
                "attack": v.get("attack"),
                "description": v.get("description"),
                "solution": v.get("solution"),
                "reference": v.get("reference")
            }
            result = remediation_pipeline.generate_remediation(finding_data)
            rem_doc = {
                "id": v.get("id", 1),
                "plain_explanation": result.get("plain_explanation", ""),
                "patch_code": result.get("patch_code", ""),
                "patch_language": result.get("patch_language", "python"),
                "created_at": datetime.utcnow()
            }
            v["remediation"] = rem_doc
            updated = True
        remediations.append(v.get("remediation"))

    if updated:
        scans_col.update_one(
            {"id": int(scan_id)},
            {"$set": {"vulnerabilities": vulns}}
        )

    return remediations
