import time
import logging
import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ZAPScanner:
    """
    Automates OWASP ZAP via its REST API:
    - Spider crawl
    - Active scan for injection, XSS, CSRF, etc.
    - Alert retrieval & classification
    """

    def __init__(self, proxy_url: Optional[str] = None, api_key: Optional[str] = None):
        self.proxy_url = (proxy_url or settings.ZAP_PROXY_URL).rstrip("/")
        self.api_key = api_key or settings.ZAP_API_KEY
        self.headers = {"X-ZAP-API-Key": self.api_key} if self.api_key else {}

    def is_zap_running(self) -> bool:
        """Checks if the ZAP daemon is accessible."""
        try:
            r = requests.get(f"{self.proxy_url}/JSON/core/view/version/", headers=self.headers, timeout=3)
            return r.status_code == 200
        except Exception:
            return False

    def spider(self, target_url: str, max_wait_seconds: int = 45) -> str:
        """Starts ZAP spider and waits for completion or timeout."""
        try:
            params = {"url": target_url, "apikey": self.api_key}
            resp = requests.get(f"{self.proxy_url}/JSON/spider/action/scan/", params=params, headers=self.headers, timeout=10)
            data = resp.json()
            scan_id = data.get("scan")
            if not scan_id:
                return ""

            # Poll spider status
            start_time = time.time()
            while time.time() - start_time < max_wait_seconds:
                status_resp = requests.get(
                    f"{self.proxy_url}/JSON/spider/view/status/",
                    params={"scanId": scan_id, "apikey": self.api_key},
                    headers=self.headers,
                    timeout=5
                )
                progress = int(status_resp.json().get("status", 0))
                if progress >= 100:
                    break
                time.sleep(2)

            return scan_id
        except Exception as e:
            logger.error(f"ZAP Spider failed: {e}")
            return ""

    def active_scan(self, target_url: str, max_wait_seconds: int = 90) -> str:
        """Starts ZAP active scan and waits for progress."""
        try:
            params = {"url": target_url, "apikey": self.api_key, "recurse": "true"}
            resp = requests.get(f"{self.proxy_url}/JSON/ascan/action/scan/", params=params, headers=self.headers, timeout=10)
            data = resp.json()
            scan_id = data.get("scan")
            if not scan_id:
                return ""

            start_time = time.time()
            while time.time() - start_time < max_wait_seconds:
                status_resp = requests.get(
                    f"{self.proxy_url}/JSON/ascan/view/status/",
                    params={"scanId": scan_id, "apikey": self.api_key},
                    headers=self.headers,
                    timeout=5
                )
                progress = int(status_resp.json().get("status", 0))
                if progress >= 100:
                    break
                time.sleep(3)

            return scan_id
        except Exception as e:
            logger.error(f"ZAP Active Scan failed: {e}")
            return ""

    def get_alerts(self, base_url: str) -> List[Dict[str, Any]]:
        """Retrieves alerts identified by OWASP ZAP for the target URL."""
        try:
            params = {"baseurl": base_url, "apikey": self.api_key}
            resp = requests.get(f"{self.proxy_url}/JSON/core/view/alerts/", params=params, headers=self.headers, timeout=15)
            data = resp.json()
            raw_alerts = data.get("alerts", [])
            formatted = []
            for alert in raw_alerts:
                formatted.append({
                    "alert": alert.get("alert"),
                    "risk": alert.get("risk", "Low"),
                    "confidence": alert.get("confidence", "Medium"),
                    "cweid": alert.get("cweid", ""),
                    "wascid": alert.get("wascid", ""),
                    "url": alert.get("url", base_url),
                    "param": alert.get("param", ""),
                    "attack": alert.get("attack", ""),
                    "description": alert.get("description", ""),
                    "solution": alert.get("solution", ""),
                    "reference": alert.get("reference", ""),
                    "raw": alert
                })
            return formatted
        except Exception as e:
            logger.error(f"Failed to fetch ZAP alerts: {e}")
            return []
