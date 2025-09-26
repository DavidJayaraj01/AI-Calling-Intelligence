"""
Authentication API routes
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.models import User
from app.schemas import Token, LoginRequest, UserCreate, UserResponse
from loguru import logger

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user from JWT token"""
    from app.core.security import verify_token
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id = verify_token(token)
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    # Update last login
    from sqlalchemy import func
    user.last_login_at = func.now()
    db.commit()
    
    logger.info(f"User {user.email} logged in successfully")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        distributor_id=user_data.distributor_id,
        vendor_id=user_data.vendor_id,
        hashed_password=hashed_password,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"New user registered: {user.email}")
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth"}
