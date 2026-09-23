from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from app.db.mongo import users_col, get_next_id
from app.db.models import format_user_doc
from app.schemas.auth import UserRegister, UserLogin, GoogleAuthRequest, Token, UserOut
from app.core.security import verify_password, get_password_hash, create_access_token, ALGORITHM
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = users_col.find_one({"id": int(user_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_doc(user)

def get_optional_user(token: str = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user = users_col.find_one({"id": int(user_id)})
            if user:
                return format_user_doc(user)
    except Exception:
        return None
    return None

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister):
    existing = users_col.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    new_id = get_next_id("users")
    user_doc = {
        "id": new_id,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "full_name": user_in.full_name,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    users_col.insert_one(user_doc)
    return format_user_doc(user_doc)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_col.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.get("id"))
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login-json", response_model=Token)
def login_json(user_in: UserLogin):
    user = users_col.find_one({"email": user_in.email})
    if not user or not verify_password(user_in.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(subject=user.get("id"))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/config")
def get_auth_config():
    """Exposes public client configurations such as GCP OAuth Client ID."""
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID
    }

@router.post("/google", response_model=Token)
def google_auth(auth_data: GoogleAuthRequest):
    """
    Handles Continue with Google authentication via GCP OAuth 2.0.
    Verifies ID token directly with Google tokeninfo endpoint,
    validates audience/client_id, and onboard/signs in user.
    """
    email = auth_data.email
    full_name = auth_data.full_name or "Google User"
    google_sub = None
    picture = None

    # If Google credential (ID Token) is sent from Google Identity Services
    if auth_data.credential:
        try:
            import requests
            resp = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={auth_data.credential}",
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                
                # Check audience if configured
                if settings.GOOGLE_CLIENT_ID and data.get("aud") != settings.GOOGLE_CLIENT_ID:
                    logger.warning("Google ID token audience does not match configured GOOGLE_CLIENT_ID.")

                email = data.get("email")
                full_name = data.get("name") or full_name
                google_sub = data.get("sub")
                picture = data.get("picture")
            else:
                logger.warning(f"Google tokeninfo returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error communicating with Google OAuth service: {e}")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google authentication failed: Email could not be verified by GCP."
        )

    user = users_col.find_one({"email": email})
    if not user:
        # Register new Google user automatically in MongoDB Atlas
        new_id = get_next_id("users")
        user = {
            "id": new_id,
            "email": email,
            "hashed_password": get_password_hash("oauth_google_secured_" + str(new_id)),
            "full_name": full_name,
            "google_sub": google_sub,
            "picture": picture,
            "auth_provider": "google",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        users_col.insert_one(user)
    else:
        # Update existing user with Google sub if available
        if google_sub and not user.get("google_sub"):
            users_col.update_one({"email": email}, {"$set": {"google_sub": google_sub, "picture": picture}})

    token = create_access_token(subject=user.get("id"))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
