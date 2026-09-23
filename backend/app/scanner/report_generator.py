import io
from datetime import datetime
from typing import Any, Dict, Union
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class ObjWrapper:
    """Recursively wraps MongoDB dicts so both scan.attr and scan['attr'] work seamlessly."""
    def __init__(self, data: Any):
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, dict):
                    setattr(self, k, ObjWrapper(v))
                elif isinstance(v, list):
                    setattr(self, k, [ObjWrapper(item) if isinstance(item, dict) else item for item in v])
                else:
                    setattr(self, k, v)
        else:
            self.__dict__ = getattr(data, "__dict__", {})

    def __getattr__(self, name: str) -> Any:
        return ""

def generate_pdf_report(raw_scan: Union[Dict[str, Any], Any]) -> io.BytesIO:
    """
    Generates an executive and technical vulnerability PDF report using ReportLab.
    Compatible with MongoDB scan documents and dicts.
    """
    scan = ObjWrapper(raw_scan) if isinstance(raw_scan, dict) else raw_scan

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palettes
    DARK_TEAL = colors.HexColor("#0f766e")
    ACCENT_TEAL = colors.HexColor("#14b8a6")
    SLATE_DARK = colors.HexColor("#0f172a")
    BORDER_COLOR = colors.HexColor("#e2e8f0")
    
    # Severity Colors
    SEV_CRITICAL = colors.HexColor("#ef4444")
    SEV_HIGH = colors.HexColor("#f97316")
    SEV_MEDIUM = colors.HexColor("#eab308")
    SEV_LOW = colors.HexColor("#3b82f6")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=SLATE_DARK,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_LEFT
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=DARK_TEAL,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#065f46"),
        backColor=colors.HexColor("#f0fdf4"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("SecScan AI Security Assessment Report", title_style))
    elements.append(Paragraph(f"Automated OWASP Top 10 Audit & AI Remediation Summary &bull; Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT_TEAL, spaceBefore=4, spaceAfter=14))

    # Formatted date
    date_str = getattr(scan, "created_at", None)
    if isinstance(date_str, datetime):
        date_str = date_str.strftime('%Y-%m-%d %H:%M')
    else:
        date_str = str(date_str or datetime.utcnow().strftime('%Y-%m-%d %H:%M'))

    # 2. Executive Metadata Box
    metadata_data = [
        [Paragraph("<b>Target Website:</b>", body_style), Paragraph(str(getattr(scan, "target_url", "")), body_style),
         Paragraph("<b>Scan Status:</b>", body_style), Paragraph(str(getattr(scan, "status", "")), body_style)],
        [Paragraph("<b>Scan ID:</b>", body_style), Paragraph(f"#{getattr(scan, 'id', '')}", body_style),
         Paragraph("<b>Date Initiated:</b>", body_style), Paragraph(date_str, body_style)],
        [Paragraph("<b>Quantified Risk Score:</b>", body_style), Paragraph(f"<b>{getattr(scan, 'risk_score', 0.0)} / 10.0</b>", body_style),
         Paragraph("<b>Total Vulnerabilities:</b>", body_style), Paragraph(str(getattr(scan, "total_vulnerabilities", 0)), body_style)]
    ]

    meta_table = Table(metadata_data, colWidths=[120, 160, 110, 142])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 3. Risk & Severity Breakdown
    elements.append(Paragraph("Executive Severity Overview", h2_style))
    severity_data = [
        [
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>Count</b>", body_style),
            Paragraph("<b>CVSS Weight</b>", body_style),
            Paragraph("<b>Action Required</b>", body_style)
        ],
        [
            Paragraph("<font color='#ef4444'><b>Critical</b></font>", body_style),
            Paragraph(str(getattr(scan, "critical_count", 0)), body_style),
            Paragraph("10.0", body_style),
            Paragraph("Immediate remediation before release", body_style)
        ],
        [
            Paragraph("<font color='#f97316'><b>High</b></font>", body_style),
            Paragraph(str(getattr(scan, "high_count", 0)), body_style),
            Paragraph("7.0", body_style),
            Paragraph("Prioritize in next sprint cycle", body_style)
        ],
        [
            Paragraph("<font color='#eab308'><b>Medium</b></font>", body_style),
            Paragraph(str(getattr(scan, "medium_count", 0)), body_style),
            Paragraph("4.0", body_style),
            Paragraph("Address during regular hardening", body_style)
        ],
        [
            Paragraph("<font color='#3b82f6'><b>Low / Info</b></font>", body_style),
            Paragraph(str(getattr(scan, "low_count", 0)), body_style),
            Paragraph("1.0", body_style),
            Paragraph("Review for defense-in-depth", body_style)
        ],
    ]

    sev_table = Table(severity_data, colWidths=[90, 60, 80, 302])
    sev_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(sev_table)
    elements.append(Spacer(1, 14))

    # 4. Detailed Vulnerabilities & AI Remediations
    elements.append(Paragraph("Vulnerability Findings & AI-Generated Patches", h2_style))

    vulns = getattr(scan, "vulnerabilities", [])
    if not vulns:
        elements.append(Paragraph("No vulnerabilities were identified during this automated security audit.", body_style))
    else:
        for idx, vuln in enumerate(vulns, 1):
            vuln_elements = []

            # Severity badge color
            sev_color = SEV_LOW
            sev_text = str(getattr(vuln, "severity", "Low")).capitalize()
            if "crit" in sev_text.lower():
                sev_color = SEV_CRITICAL
            elif "high" in sev_text.lower():
                sev_color = SEV_HIGH
            elif "med" in sev_text.lower():
                sev_color = SEV_MEDIUM

            header_text = f"<b>{idx}. {getattr(vuln, 'alert_title', 'Vulnerability')}</b>"
            vuln_elements.append(Paragraph(header_text, ParagraphStyle('VulnTitle', parent=body_style, fontSize=11, leading=14, textColor=SLATE_DARK)))
            vuln_elements.append(Spacer(1, 3))

            detail_info = (
                f"<b>Severity:</b> <font color='{sev_color.hexval()}'><b>{sev_text}</b></font> &nbsp;|&nbsp; "
                f"<b>CWE:</b> {getattr(vuln, 'cwe_id', 'N/A')} &nbsp;|&nbsp; "
                f"<b>URL:</b> {getattr(vuln, 'url', 'N/A')}"
            )
            vuln_elements.append(Paragraph(detail_info, body_style))
            vuln_elements.append(Spacer(1, 4))

            desc = getattr(vuln, "description", "")
            if desc:
                vuln_elements.append(Paragraph(f"<b>Scanner Description:</b> {desc}", body_style))
                vuln_elements.append(Spacer(1, 4))

            # AI Remediation section if exists
            rem = getattr(vuln, "remediation", None)
            if rem and getattr(rem, "plain_explanation", ""):
                vuln_elements.append(Paragraph("<b>AI Security Explanation:</b>", ParagraphStyle('AIHeader', parent=body_style, fontName='Helvetica-Bold', textColor=DARK_TEAL)))
                vuln_elements.append(Paragraph(getattr(rem, "plain_explanation", ""), body_style))
                vuln_elements.append(Spacer(1, 4))

                patch = getattr(rem, "patch_code", "")
                lang = getattr(rem, "patch_language", "code")
                vuln_elements.append(Paragraph(f"<b>Recommended Code Patch ({lang}):</b>", ParagraphStyle('PatchHeader', parent=body_style, fontName='Helvetica-Bold', textColor=DARK_TEAL)))
                vuln_elements.append(Paragraph(patch.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
            else:
                sol = getattr(vuln, "solution", "")
                vuln_elements.append(Paragraph(f"<b>Standard Solution:</b> {sol or 'Apply security hardening headers and input validation.'}", body_style))

            vuln_elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=8, spaceAfter=10))
            elements.append(KeepTogether(vuln_elements))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
