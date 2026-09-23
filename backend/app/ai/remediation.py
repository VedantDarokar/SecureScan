import json
import logging
import requests
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ai.prompts import SYSTEM_SECURITY_PROMPT, remediation_prompt_template

logger = logging.getLogger(__name__)

class RemediationPipeline:
    """
    Google Gemini remediation engine.
    Converts raw scanner findings into plain-English explanations
    and ready-to-apply secure code patches.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL

    def generate_remediation(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates remediation using Gemini API, or falls back to rule-based security templates.
        """
        if self.api_key and self.api_key != "your-google-gemini-api-key-here":
            try:
                user_content = remediation_prompt_template.format(
                    alert_title=finding.get("alert_title") or finding.get("alert", "Vulnerability"),
                    severity=finding.get("severity") or finding.get("risk", "Medium"),
                    cwe_id=str(finding.get("cwe_id") or finding.get("cweid", "N/A")),
                    wasc_id=str(finding.get("wasc_id") or finding.get("wascid", "N/A")),
                    url=finding.get("url", ""),
                    param=finding.get("param", ""),
                    attack=finding.get("attack", ""),
                    description=finding.get("description", ""),
                    solution=finding.get("solution", ""),
                    reference=finding.get("reference", "")
                )

                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": user_content}]}],
                    "system_instruction": {"parts": [{"text": SYSTEM_SECURITY_PROMPT}]},
                    "generationConfig": {
                        "response_mime_type": "application/json",
                        "temperature": 0.2
                    }
                }
                resp = requests.post(url, json=payload, timeout=12)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(text)
                        return {
                            "plain_explanation": parsed.get("plain_explanation", ""),
                            "patch_code": parsed.get("patch_code", ""),
                            "patch_language": parsed.get("patch_language", "javascript"),
                            "prevention_steps": parsed.get("prevention_steps", [])
                        }
                else:
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}). Falling back to contextual rule-based patch.")

        # Fallback to curated OWASP rule-based patches
        return self._rule_based_fallback(finding)

    def _rule_based_fallback(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic, high-quality fallback patches for OWASP Top 10 vulnerabilities.
        """
        title = (finding.get("alert_title") or finding.get("alert", "")).lower()

        if "content security policy" in title or "csp" in title:
            return {
                "plain_explanation": (
                    "Content Security Policy (CSP) is an essential HTTP response header that acts as a browser-side firewall. "
                    "Without CSP, malicious scripts injected via Cross-Site Scripting (XSS) can execute freely, steal session tokens, "
                    "and deface the web application. Implementing a strict CSP instructs browsers to only execute scripts and load resources from trusted domains."
                ),
                "patch_code": (
                    "# Nginx Web Server Configuration\n"
                    "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' https://trustedscripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; frame-ancestors 'none';\" always;\n\n"
                    "# FastAPI / Python Middleware\n"
                    "from starlette.middleware.base import BaseHTTPMiddleware\n\n"
                    "class SecurityHeadersMiddleware(BaseHTTPMiddleware):\n"
                    "    async def dispatch(self, request, call_next):\n"
                    "        response = await call_next(request)\n"
                    "        response.headers['Content-Security-Policy'] = \"default-src 'self'; script-src 'self'; object-src 'none';\"\n"
                    "        return response\n"
                    "app.add_middleware(SecurityHeadersMiddleware)"
                ),
                "patch_language": "python",
                "prevention_steps": [
                    "Define restrictive default-src 'self' directive.",
                    "Disallow 'unsafe-eval' and minimize 'unsafe-inline'.",
                    "Deploy CSP reporting (report-uri / report-to) to monitor violations in staging."
                ]
            }

        elif "clickjacking" in title or "x-frame-options" in title:
            return {
                "plain_explanation": (
                    "Clickjacking (UI redressing) occurs when an attacker renders your website inside a transparent or hidden iframe on a malicious webpage. "
                    "When users click on the malicious page, they unknowingly interact with buttons on your site (e.g., authorizing payments, changing account settings). "
                    "The X-Frame-Options and CSP frame-ancestors headers prevent your application from being framed."
                ),
                "patch_code": (
                    "# FastAPI / Starlette Header Patch\n"
                    "@app.middleware('http')\n"
                    "async def add_anti_clickjacking_headers(request, call_next):\n"
                    "    response = await call_next(request)\n"
                    "    response.headers['X-Frame-Options'] = 'DENY'\n"
                    "    response.headers['Content-Security-Policy'] = \"frame-ancestors 'none';\"\n"
                    "    return response\n\n"
                    "# Nginx Configuration\n"
                    "add_header X-Frame-Options \"DENY\" always;"
                ),
                "patch_language": "python",
                "prevention_steps": [
                    "Send 'X-Frame-Options: DENY' for pages that must never be framed.",
                    "Use 'SAMEORIGIN' only if framing by your own domain is required.",
                    "Combine with CSP 'frame-ancestors' for modern browser support."
                ]
            }

        elif "sql" in title or "injection" in title:
            return {
                "plain_explanation": (
                    "SQL Injection happens when untrusted user input is directly concatenated into SQL queries without parameterization. "
                    "An attacker can alter the query structure to bypass authentication, extract sensitive databases, or modify records. "
                    "The vulnerability is resolved by using prepared statements and parameterized queries via an ORM."
                ),
                "patch_code": (
                    "# VULNERABLE CODE (DO NOT USE):\n"
                    "# query = f\"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'\"\n\n"
                    "# CORRECT REMEDIATION (SQLAlchemy Parameterized Query):\n"
                    "from sqlalchemy.orm import Session\n"
                    "from app.db.models import User\n\n"
                    "def get_user_securely(db: Session, username: str):\n"
                    "    # Uses prepared statements under the hood, completely immune to SQLi\n"
                    "    return db.query(User).filter(User.username == username).first()"
                ),
                "patch_language": "python",
                "prevention_steps": [
                    "Always use parameterized queries or ORM abstractions (SQLAlchemy, Prisma, etc.).",
                    "Never format or concatenate raw strings into SQL statements.",
                    "Apply database principle of least privilege (limit database account permissions)."
                ]
            }

        elif "cross" in title or "xss" in title:
            return {
                "plain_explanation": (
                    "Cross-Site Scripting (XSS) permits attackers to inject malicious JavaScript into web pages viewed by other users. "
                    "This leads to stolen session cookies, credential harvesting, and unauthorized actions performed on behalf of the victim. "
                    "The fix requires contextual output encoding and sanitization of any user-controlled input."
                ),
                "patch_code": (
                    "// React.js / Frontend Remediation (Safe rendering)\n"
                    "// React automatically escapes content rendered in JSX {variable}.\n"
                    "// If HTML rendering is required, sanitize using DOMPurify:\n"
                    "import DOMPurify from 'dompurify';\n\n"
                    "function SafeUserContent({ htmlContent }) {\n"
                    "  const cleanHtml = DOMPurify.sanitize(htmlContent);\n"
                    "  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;\n"
                    "}"
                ),
                "patch_language": "javascript",
                "prevention_steps": [
                    "Contextually encode user input before rendering in HTML, attributes, or JavaScript.",
                    "Sanitize untrusted rich HTML using DOMPurify.",
                    "Enforce strict Content-Security-Policy (CSP)."
                ]
            }

        else:
            return {
                "plain_explanation": (
                    f"The scanner flagged '{finding.get('alert_title', 'Security Misconfiguration')}', indicating a departure from standard security hardening. "
                    "Leaving default configurations or missing defense-in-depth headers exposes the application to reconnaissance and automated exploitation."
                ),
                "patch_code": (
                    "# Standard Security Hardening Middleware (FastAPI / Python)\n"
                    "@app.middleware('http')\n"
                    "async def add_security_headers(request, call_next):\n"
                    "    response = await call_next(request)\n"
                    "    response.headers['X-Content-Type-Options'] = 'nosniff'\n"
                    "    response.headers['X-Frame-Options'] = 'DENY'\n"
                    "    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'\n"
                    "    return response"
                ),
                "patch_language": "python",
                "prevention_steps": [
                    "Audit server headers and disable unnecessary banner disclosure.",
                    "Adopt automated static and dynamic security analysis in CI/CD.",
                    "Keep dependencies up to date."
                ]
            }

remediation_pipeline = RemediationPipeline()
