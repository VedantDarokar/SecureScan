from typing import List, Dict, Any, Tuple
from app.db.models import VulnerabilitySeverity

def normalize_severity(raw_risk: str) -> VulnerabilitySeverity:
    """Normalizes ZAP or crawler risk strings into standard Severity Enum."""
    clean = str(raw_risk).strip().capitalize()
    if clean in ("Critical", "Crit"):
        return VulnerabilitySeverity.CRITICAL
    elif clean in ("High",):
        return VulnerabilitySeverity.HIGH
    elif clean in ("Medium", "Med"):
        return VulnerabilitySeverity.MEDIUM
    elif clean in ("Low",):
        return VulnerabilitySeverity.LOW
    else:
        return VulnerabilitySeverity.INFO

def calculate_risk_score(vulnerabilities: List[Dict[str, Any]]) -> Tuple[float, Dict[str, int]]:
    """
    Computes a quantified 1.0 - 10.0 risk score aligned with CVSS principles:
    - Critical vulnerabilities heavily drive score towards 8.5 - 10.0
    - High vulnerabilities weight score towards 6.0 - 8.4
    - Medium vulnerabilities weight score towards 3.5 - 5.9
    - Low vulnerabilities weight score towards 1.0 - 3.4
    - Clean sites score 0.0
    """
    counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }

    for vuln in vulnerabilities:
        sev = normalize_severity(vuln.get("risk", "Low"))
        if sev == VulnerabilitySeverity.CRITICAL:
            counts["critical"] += 1
        elif sev == VulnerabilitySeverity.HIGH:
            counts["high"] += 1
        elif sev == VulnerabilitySeverity.MEDIUM:
            counts["medium"] += 1
        elif sev == VulnerabilitySeverity.LOW:
            counts["low"] += 1
        else:
            counts["info"] += 1

    total = sum(counts.values())
    if total == 0:
        return 0.0, counts

    # Base weighted impact score
    raw_points = (
        counts["critical"] * 10.0 +
        counts["high"] * 6.5 +
        counts["medium"] * 3.0 +
        counts["low"] * 1.0
    )

    # Nonlinear scaling to 1.0 - 10.0 range
    if counts["critical"] > 0:
        base = 8.5
        extra = min(1.5, (counts["critical"] - 1) * 0.5 + counts["high"] * 0.2)
        score = base + extra
    elif counts["high"] > 0:
        base = 6.0
        extra = min(2.4, (counts["high"] - 1) * 0.6 + counts["medium"] * 0.3)
        score = base + extra
    elif counts["medium"] > 0:
        base = 3.5
        extra = min(2.4, (counts["medium"] - 1) * 0.5 + counts["low"] * 0.2)
        score = base + extra
    elif counts["low"] > 0:
        base = 1.0
        extra = min(2.4, counts["low"] * 0.4)
        score = base + extra
    else:
        score = 0.5

    final_score = round(min(10.0, max(0.0, score)), 1)
    return final_score, counts
