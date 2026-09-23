from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, HttpUrl

class ScanCreate(BaseModel):
    target_url: str

class RemediationOut(BaseModel):
    id: int
    plain_explanation: str
    patch_code: str
    patch_language: str
    created_at: datetime

    class Config:
        from_attributes = True

class VulnerabilityOut(BaseModel):
    id: int
    alert_title: str
    severity: str
    confidence: Optional[str]
    cwe_id: Optional[str]
    wasc_id: Optional[str]
    url: Optional[str]
    param: Optional[str]
    attack: Optional[str]
    description: Optional[str]
    solution: Optional[str]
    reference: Optional[str]
    remediation: Optional[RemediationOut] = None

    class Config:
        from_attributes = True

class ScanOut(BaseModel):
    id: int
    target_url: str
    status: str
    progress: int
    risk_score: float
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    vulnerabilities: Optional[List[VulnerabilityOut]] = []

    class Config:
        from_attributes = True

class ScanSummary(BaseModel):
    id: int
    target_url: str
    status: str
    progress: int
    risk_score: float
    total_vulnerabilities: int
    created_at: datetime

    class Config:
        from_attributes = True
