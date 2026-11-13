from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.models import User, UserSkill
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=email_clean,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name.strip(),
        college_org=user_in.college_org,
        country=user_in.country,
        timezone=user_in.timezone or "UTC",
        role="participant",
        experience_level="Intermediate",
        preferred_role="Full Stack Developer",
        preferred_working_hours="Flexible",
        availability_hours_per_week=20,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Seed initial default skill for convenience
    default_skill = UserSkill(
        user_id=new_user.id,
        skill_name="Python",
        proficiency=3,
        category="backend"
    )
    db.add(default_skill)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        subject=new_user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_in.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

