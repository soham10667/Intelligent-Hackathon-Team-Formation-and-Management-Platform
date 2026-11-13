from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.models.models import User, UserSkill
from app.schemas.schemas import UserResponse, UserProfileUpdate, UserPublic
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Profiles"])

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile_in.model_dump(exclude_unset=True)
    
    # Handle nested skills update if provided
    if "skills" in update_data and update_data["skills"] is not None:
        skills_data = update_data.pop("skills")
        # Remove existing skills
        db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()
        # Add updated skills
        for s in skills_data:
            skill = UserSkill(
                user_id=current_user.id,
                skill_name=s["skill_name"].strip(),
                proficiency=s.get("proficiency", 3),
                category=s.get("category", "general")
            )
            db.add(skill)

    # Update direct user fields
    for field, val in update_data.items():
        if hasattr(current_user, field) and val is not None:
            setattr(current_user, field, val)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.get("/{user_id}", response_model=UserPublic)
def get_user_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserPublic.model_validate(user)

@router.get("/", response_model=List[UserPublic])
def search_users(
    q: Optional[str] = Query(None, description="Search by name, headline or skill"),
    role: Optional[str] = Query(None, description="Filter by preferred role"),
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.is_active == True)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.headline.ilike(search_pattern),
                User.skills.any(UserSkill.skill_name.ilike(search_pattern))
            )
        )
    if role:
        query = query.filter(User.preferred_role.ilike(f"%{role}%"))
    
    users = query.offset(offset).limit(limit).all()
    return [UserPublic.model_validate(u) for u in users]

