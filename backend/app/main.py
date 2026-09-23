from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongo import get_db
from app.api import auth, scan

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Automated Web Vulnerability Scanner & AI-Powered Remediation API (MongoDB)",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(scan.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "database": "MongoDB",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    db = get_db()
    return {
        "status": "healthy",
        "database": f"MongoDB ({db.name})",
        "endpoints": {
            "auth": f"{settings.API_V1_STR}/auth",
            "scans": f"{settings.API_V1_STR}/scans"
        }
    }
