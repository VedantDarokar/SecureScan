import logging
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Set

logger = logging.getLogger(__name__)

class TargetCrawler:
    """
    Crawls the target site using Requests and BeautifulSoup to map endpoints,
    forms, and detect client-side / HTTP header vulnerabilities (OWASP Top 10).
    """

    def __init__(self, target_url: str, max_pages: int = 15, timeout: int = 8):
        self.target_url = target_url
        self.max_pages = max_pages
        self.timeout = timeout
        self.base_domain = urlparse(target_url).netloc
        self.visited_urls: Set[str] = set()
        self.discovered_forms: List[Dict[str, Any]] = []
        self.header_findings: List[Dict[str, Any]] = []

    def is_same_domain(self, url: str) -> bool:
        return urlparse(url).netloc == self.base_domain

    def crawl_and_audit(self) -> Dict[str, Any]:
        """
        Crawls the target domain up to max_pages, checks headers and forms.
        """
        queue = [self.target_url]
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecScanAI-Auditor/1.0"
        })

        while queue and len(self.visited_urls) < self.max_pages:
            current_url = queue.pop(0)
            if current_url in self.visited_urls:
                continue

            try:
                response = session.get(current_url, timeout=self.timeout, verify=False, allow_redirects=True)
                self.visited_urls.add(current_url)

                # Check security headers on root / first page
                if len(self.visited_urls) == 1:
                    self._audit_security_headers(response)

                # Parse HTML
                content_type = response.headers.get("Content-Type", "")
                if "text/html" in content_type:
                    soup = BeautifulSoup(response.text, "html.parser")

                    # Discover forms
                    for form in soup.find_all("form"):
                        action = form.get("action") or ""
                        form_url = urljoin(current_url, action)
                        method = (form.get("method") or "GET").upper()
                        inputs = [inp.get("name") for inp in form.find_all(["input", "textarea"]) if inp.get("name")]
                        self.discovered_forms.append({
                            "page": current_url,
                            "action": form_url,
                            "method": method,
                            "inputs": inputs
                        })

                    # Discover links
                    for link in soup.find_all("a", href=True):
                        href = link["href"]
                        full_url = urljoin(current_url, href)
                        parsed = urlparse(full_url)
                        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                        if self.is_same_domain(clean_url) and clean_url not in self.visited_urls:
                            queue.append(clean_url)

            except Exception as e:
                logger.warning(f"Error crawling {current_url}: {e}")

        return {
            "crawled_urls": list(self.visited_urls),
            "forms": self.discovered_forms,
            "header_findings": self.header_findings
        }

    def _audit_security_headers(self, response: requests.Response):
        """
        Audits OWASP Top 10 Security Misconfigurations via HTTP response headers.
        """
        headers = response.headers

        # 1. Content-Security-Policy
        if "Content-Security-Policy" not in headers:
            self.header_findings.append({
                "alert": "Content Security Policy (CSP) Header Not Set",
                "risk": "Medium",
                "confidence": "High",
                "cweid": "693",
                "wascid": "15",
                "url": response.url,
                "param": "Content-Security-Policy",
                "description": "Content Security Policy (CSP) is an added layer of security that helps detect and mitigate Cross-Site Scripting (XSS) and data injection attacks.",
                "solution": "Configure a robust Content-Security-Policy header in your web server or reverse proxy restricting trusted sources of content.",
                "reference": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
            })

        # 2. X-Frame-Options (Clickjacking)
        if "X-Frame-Options" not in headers:
            self.header_findings.append({
                "alert": "Missing Anti-Clickjacking Header (X-Frame-Options)",
                "risk": "Medium",
                "confidence": "High",
                "cweid": "1021",
                "wascid": "15",
                "url": response.url,
                "param": "X-Frame-Options",
                "description": "The response does not include an X-Frame-Options header, leaving the application susceptible to clickjacking attacks via iframes.",
                "solution": "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' to HTTP response headers.",
                "reference": "https://owasp.org/www-community/attacks/Clickjacking"
            })

        # 3. X-Content-Type-Options
        if headers.get("X-Content-Type-Options", "").lower() != "nosniff":
            self.header_findings.append({
                "alert": "X-Content-Type-Options Header Missing or Invalid",
                "risk": "Low",
                "confidence": "High",
                "cweid": "16",
                "wascid": "15",
                "url": response.url,
                "param": "X-Content-Type-Options",
                "description": "Ensures MIME types specified in Content-Type headers are strictly adhered to by browsers, preventing MIME sniffing attacks.",
                "solution": "Set 'X-Content-Type-Options: nosniff' header on all responses.",
                "reference": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"
            })

        # 4. Strict-Transport-Security (HSTS)
        if response.url.startswith("https://") and "Strict-Transport-Security" not in headers:
            self.header_findings.append({
                "alert": "Strict-Transport-Security (HSTS) Header Missing",
                "risk": "Low",
                "confidence": "High",
                "cweid": "319",
                "wascid": "15",
                "url": response.url,
                "param": "Strict-Transport-Security",
                "description": "HTTP Strict Transport Security informs browsers that the site should only be accessed using HTTPS.",
                "solution": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header.",
                "reference": "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html"
            })

        # 5. Server Information Leakage
        if "Server" in headers or "X-Powered-By" in headers:
            server_banner = headers.get("Server") or headers.get("X-Powered-By")
            self.header_findings.append({
                "alert": "Server Leaks Version Information via HTTP Header",
                "risk": "Low",
                "confidence": "Medium",
                "cweid": "200",
                "wascid": "13",
                "url": response.url,
                "param": "Server / X-Powered-By",
                "description": f"The web server exposes software/framework fingerprint: {server_banner}",
                "solution": "Disable server banners and version disclosure tokens in web server configuration.",
                "reference": "https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration"
            })
