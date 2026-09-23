from langchain_core.prompts import PromptTemplate

SYSTEM_SECURITY_PROMPT = """You are a Principal Application Security Engineer and DevSecOps Architect.
Your role is to analyze raw web vulnerability scan findings (from OWASP ZAP and web crawlers) and provide:
1. A clear, plain-English explanation of the security flaw suitable for developers and project stakeholders.
2. An exact, production-ready code patch that fixes the vulnerability following OWASP security standards.
3. Concrete prevention steps.

Guidelines:
- Explain what the vulnerability is in simple, non-technical terms, why it matters, and how an attacker could exploit it.
- The code patch must be defensive, secure, and ready to apply (e.g., parameterized queries for SQLi, output encoding / DOMPurify for XSS, secure HTTP headers, CSRF token validation).
- Never provide offensive payloads or weaponized exploits. Focus strictly on defensive remediation.
- Return ONLY a valid JSON object matching the requested schema. Do not add markdown backticks outside the JSON.
"""

REMEDIATION_USER_PROMPT = """Analyze the following detected vulnerability and generate the remediation details:

--- VULNERABILITY FINDING ---
Alert Title: {alert_title}
Severity: {severity}
CWE ID: {cwe_id}
WASC ID: {wasc_id}
Target URL: {url}
Vulnerable Parameter: {param}
Evidence / Attack Used: {attack}
Description: {description}
Scanner Suggested Solution: {solution}
Reference: {reference}

--- REQUIRED JSON OUTPUT FORMAT ---
{{
  "plain_explanation": "A 2-3 paragraph plain-English explanation: (1) what this flaw is, (2) the real-world risk or business impact, and (3) why the patch fixes it.",
  "patch_code": "// Complete, commented, ready-to-use code fix or configuration snippet implementing OWASP best practices",
  "patch_language": "language name in lowercase (e.g., python, javascript, nginx, html, sql, php)",
  "prevention_steps": [
    "Step 1: Specific architectural fix",
    "Step 2: Best practice code or configuration guideline",
    "Step 3: Automated testing / linting check"
  ]
}}
"""

remediation_prompt_template = PromptTemplate(
    template=REMEDIATION_USER_PROMPT,
    input_variables=[
        "alert_title",
        "severity",
        "cwe_id",
        "wasc_id",
        "url",
        "param",
        "attack",
        "description",
        "solution",
        "reference"
    ]
)
