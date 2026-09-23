import os
import sys
import json
import requests

# Configure UTF-8 for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.core.config import settings
from app.ai.remediation import remediation_pipeline

def test_gemini():
    print("=" * 65)
    print("[*] SECSCAN AI - GOOGLE GEMINI API DIAGNOSTIC")
    print("=" * 65)

    key = settings.GEMINI_API_KEY
    if not key or key == "your-google-gemini-api-key-here":
        print("[-] STATUS: No API Key Configured in backend/.env")
        return False

    print(f"[+] API Key Configured: {key[:6]}...{key[-4:]} (Length: {len(key)})")
    print(f"[+] Model Configured: {settings.GEMINI_MODEL}")
    print("[*] Testing live connection to Google Gemini API...")

    # Step 1: Direct endpoint ping
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": "Reply with 'GEMINI_ONLINE'"}]}]
        }
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code != 200:
            print(f"[-] API Error (HTTP {resp.status_code}): {resp.text[:200]}")
            return False

        reply = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        print(f"[+] SUCCESS: Google Gemini is online! (Response: '{reply}')")
    except Exception as e:
        print(f"[-] Connection failed: {e}")
        return False

    # Step 2: Full End-to-End Remediation Pipeline
    print("\n[*] Testing AppSec Vulnerability Patch Generation with Gemini...")
    try:
        sample_finding = {
            "alert_title": "SQL Injection in Login Endpoint",
            "severity": "High",
            "cwe_id": "89",
            "url": "https://example.com/api/v1/auth/login",
            "param": "username",
            "attack": "' OR '1'='1",
            "description": "User input directly formatted into raw SQL query without parameterization."
        }
        result = remediation_pipeline.generate_remediation(sample_finding)
        print("[+] SUCCESS: AI Remediation Generated Successfully!")
        print(f"    - Patch Language: {result.get('patch_language')}")
        print(f"    - Explanation: {result.get('plain_explanation')[:130]}...")
        print(f"    - Patch Code (first 2 lines):\n        {result.get('patch_code', '').splitlines()[0] if result.get('patch_code') else 'N/A'}")
        print("=" * 65)
        print(">>> ALL GEMINI API SERVICES ARE WORKING 100% PERFECTLY! <<<")
        print("=" * 65)
        return True
    except Exception as e:
        print(f"[-] Remediation test error: {e}")
        return False

if __name__ == "__main__":
    test_gemini()
