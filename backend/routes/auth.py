import os
import datetime
from typing import Optional, List
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel
from backend.config import settings
from backend.database import get_db_connection, hash_password, verify_password, log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = settings.JWT_ALGORITHM
TOKEN_EXPIRE_HOURS = settings.ACCESS_TOKEN_EXPIRE_MINUTES / 60

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    company: Optional[str] = ""

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    company: Optional[str] = ""
    role: str
    organization_id: Optional[int] = 1
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserResponse
    message: str

def create_access_token(user_id: int, email: str, role: str, org_id: int = 1) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "org_id": org_id,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token.")

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header."
        )
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, company, role, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    # Fetch tenant association
    cursor.execute("SELECT organization_id, role as org_role FROM organization_members WHERE user_id = ?", (user_id,))
    member_row = cursor.fetchone()
    conn.close()

    user_dict = dict(row)
    user_dict["organization_id"] = member_row["organization_id"] if member_row else 1
    user_dict["org_role"] = member_row["org_role"] if member_row else user_dict.get("role", "member")

    return user_dict

def require_roles(allowed_roles: List[str]):
    """Role-Based Access Control Dependency Generator."""
    def role_checker(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "member")
        org_role = user.get("org_role", user_role)
        effective_roles = {user_role, org_role}
        
        # System admin / owner always granted full access
        if "owner" in effective_roles or "admin" in effective_roles:
            return user

        if not any(r in effective_roles for r in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles."
            )
        return user
    return role_checker

@router.post("/login", response_model=AuthResponse)
def login(creds: LoginRequest):
    email = creds.email.strip().lower()
    password = creds.password.strip()

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, name, company, password_hash, salt, role, created_at FROM users WHERE lower(email) = ?",
        (email,)
    )
    user = cursor.fetchone()

    if not user or not verify_password(password, user["password_hash"], user["salt"]):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials or click 1-Click Demo."
        )

    cursor.execute("SELECT organization_id FROM organization_members WHERE user_id = ?", (user["id"],))
    org_row = cursor.fetchone()
    conn.close()

    org_id = org_row["organization_id"] if org_row else 1
    token = create_access_token(user["id"], user["email"], user["role"], org_id)
    
    log_audit_event(
        action="user.login",
        resource="AuthService",
        details=f"User {user['email']} authenticated successfully",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    user_data = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        company=user["company"] or "",
        role=user["role"],
        organization_id=org_id,
        created_at=str(user["created_at"])
    )

    return AuthResponse(
        token=token,
        user=user_data,
        message="Login successful"
    )

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    name = req.name.strip()
    email = req.email.strip().lower()
    password = req.password.strip()
    company = req.company.strip() if req.company else ""

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters long.")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE lower(email) = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    pwd_hash, salt = hash_password(password)
    cursor.execute(
        "INSERT INTO users (email, name, company, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
        (email, name, company, pwd_hash, salt, "member")
    )
    conn.commit()
    new_user_id = cursor.lastrowid

    # Create default personal organization for new signups
    org_slug = f"org-{new_user_id}-{email.split('@')[0]}"
    org_name = company if company else f"{name}'s Brand"
    cursor.execute("INSERT INTO organizations (name, slug, plan_id) VALUES (?, ?, 'starter')", (org_name, org_slug))
    new_org_id = cursor.lastrowid

    # Associate as owner of this new organization
    cursor.execute("""
        INSERT INTO organization_members (organization_id, user_id, role, title)
        VALUES (?, ?, 'owner', 'Account Owner')
    """, (new_org_id, new_user_id))
    conn.commit()

    cursor.execute("SELECT id, email, name, company, role, created_at FROM users WHERE id = ?", (new_user_id,))
    new_user = cursor.fetchone()
    conn.close()

    token = create_access_token(new_user["id"], new_user["email"], new_user["role"], new_org_id)
    user_data = UserResponse(
        id=new_user["id"],
        email=new_user["email"],
        name=new_user["name"],
        company=new_user["company"] or "",
        role=new_user["role"],
        organization_id=new_org_id,
        created_at=str(new_user["created_at"])
    )

    return AuthResponse(
        token=token,
        user=user_data,
        message="Account registered successfully"
    )

@router.post("/demo-login", response_model=AuthResponse)
def demo_login():
    """Provides instantaneous single-click login for project evaluators & reviewers."""
    from backend.database import init_auth_db
    init_auth_db()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, company, role, created_at FROM users WHERE email = 'evaluator@retailpulse.ai'")
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=500, detail="Evaluator account could not be initialized.")

    token = create_access_token(user["id"], user["email"], user["role"], 1)
    user_data = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        company=user["company"] or "RetailPulse Evaluation Team",
        role=user["role"],
        organization_id=1,
        created_at=str(user["created_at"])
    )

    return AuthResponse(
        token=token,
        user=user_data,
        message="Demo evaluator authentication granted"
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        company=user["company"] or "",
        role=user["role"],
        organization_id=user.get("organization_id", 1),
        created_at=str(user["created_at"])
    )
