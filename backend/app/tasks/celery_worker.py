import json
import logging
from datetime import datetime
from celery import Celery
from app.core.config import settings
from app.db.mongo import scans_col
from app.db.models import ScanStatus
from app.scanner.crawler import TargetCrawler
from app.scanner.zap_engine import ZAPScanner
from app.scanner.scoring import calculate_risk_score, normalize_severity

logger = logging.getLogger(__name__)

celery_app = Celery(
    "scanner_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    broker_connection_timeout=1.0,
    redis_socket_connect_timeout=1.0,
    redis_socket_timeout=1.0,
)

def execute_scan_pipeline(scan_id: int):
    """
    Core scanning workflow saving directly into MongoDB:
    1. Crawls target site (endpoints, forms, headers).
    2. Runs OWASP ZAP spider & active scan if ZAP is running.
    3. Normalizes and aggregates all findings.
    4. Computes 1-10 quantified risk score.
    5. Saves embedded vulnerability documents into MongoDB scan record.
    """
    try:
        scan = scans_col.find_one({"id": int(scan_id)})
        if not scan:
            logger.error(f"Scan with ID {scan_id} not found in MongoDB.")
            return

        scans_col.update_one(
            {"id": int(scan_id)},
            {"$set": {"status": ScanStatus.RUNNING, "progress": 10}}
        )

        target_url = scan.get("target_url")
        logger.info(f"Starting vulnerability audit on: {target_url}")

        # Step 1: BeautifulSoup & Requests Crawler
        crawler = TargetCrawler(target_url=target_url, max_pages=10)
        crawl_result = crawler.crawl_and_audit()
        
        all_findings = []
        all_findings.extend(crawl_result.get("header_findings", []))

        scans_col.update_one(
            {"id": int(scan_id)},
            {"$set": {"progress": 40}}
        )

        # Step 2: OWASP ZAP Engine (if daemon is active)
        zap = ZAPScanner()
        if zap.is_zap_running():
            logger.info("OWASP ZAP daemon detected. Starting spider & active scan...")
            zap.spider(target_url, max_wait_seconds=30)
            scans_col.update_one({"id": int(scan_id)}, {"$set": {"progress": 60}})

            zap.active_scan(target_url, max_wait_seconds=60)
            scans_col.update_one({"id": int(scan_id)}, {"$set": {"progress": 80}})

            zap_alerts = zap.get_alerts(target_url)
            all_findings.extend(zap_alerts)
        else:
            logger.info("OWASP ZAP daemon not running on port 8080. Using crawler security audit findings.")
            scans_col.update_one({"id": int(scan_id)}, {"$set": {"progress": 80}})

        # Deduplicate findings by (alert, param, url)
        seen = set()
        deduped_findings = []
        for f in all_findings:
            key = (f.get("alert"), f.get("param"), f.get("url"))
            if key not in seen:
                seen.add(key)
                deduped_findings.append(f)

        # Step 3: Risk Scoring & Classification
        risk_score, counts = calculate_risk_score(deduped_findings)

        # Step 4: Create embedded vulnerability documents
        vulns_docs = []
        for idx, f in enumerate(deduped_findings, 1):
            sev = normalize_severity(f.get("risk", "Low"))
            sev_str = sev.value if hasattr(sev, "value") else str(sev)
            vulns_docs.append({
                "id": idx,
                "alert_title": f.get("alert", "Vulnerability Detected"),
                "severity": sev_str,
                "confidence": f.get("confidence", "Medium"),
                "cwe_id": str(f.get("cweid", "")),
                "wasc_id": str(f.get("wascid", "")),
                "url": f.get("url", target_url),
                "param": f.get("param", ""),
                "attack": f.get("attack", ""),
                "description": f.get("description", ""),
                "solution": f.get("solution", ""),
                "reference": f.get("reference", ""),
                "remediation": None
            })

        # Step 5: Update Scan Document in MongoDB
        scans_col.update_one(
            {"id": int(scan_id)},
            {"$set": {
                "status": ScanStatus.COMPLETED,
                "progress": 100,
                "risk_score": risk_score,
                "total_vulnerabilities": len(deduped_findings),
                "critical_count": counts["critical"],
                "high_count": counts["high"],
                "medium_count": counts["medium"],
                "low_count": counts["low"],
                "completed_at": datetime.utcnow(),
                "vulnerabilities": vulns_docs
            }}
        )
        logger.info(f"Scan {scan_id} finished successfully in MongoDB. Risk Score: {risk_score}")

    except Exception as e:
        logger.exception(f"Scan {scan_id} encountered an error: {e}")
        scans_col.update_one(
            {"id": int(scan_id)},
            {"$set": {
                "status": ScanStatus.FAILED,
                "error_message": str(e)
            }}
        )

@celery_app.task(name="tasks.run_scan")
def run_scan_task(scan_id: int):
    """Celery task wrapper."""
    execute_scan_pipeline(scan_id)
