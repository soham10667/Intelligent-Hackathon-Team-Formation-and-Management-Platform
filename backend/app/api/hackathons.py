from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.models.models import Hackathon, HackathonParticipant, Team, TeamMember, User
from app.schemas.schemas import HackathonResponse, HackathonCreate
from app.api.deps import get_current_user, get_optional_current_user, get_current_admin
from app.services.audit_service import log_activity

router = APIRouter(prefix="/hackathons", tags=["Hackathons"])

@router.get("", response_model=List[HackathonResponse])
def list_hackathons(
    q: Optional[str] = Query(None, description="Search by title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (upcoming, ongoing, ended)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Hackathon)
    if status:
        query = query.filter(Hackathon.status == status)
    if q:
        query = query.filter(or_(
            Hackathon.title.ilike(f"%{q}%"),
            Hackathon.description.ilike(f"%{q}%")
        ))
    
    hackathons = query.order_by(Hackathon.start_date.desc()).all()
    results = []

    # Pre-fetch user participations and teams if logged in
    user_registered_hackathons = set()
    user_team_map = {}
    if current_user:
        parts = db.query(HackathonParticipant.hackathon_id).filter(
            HackathonParticipant.user_id == current_user.id
        ).all()
        user_registered_hackathons = {p[0] for p in parts}

        memberships = db.query(TeamMember.hackathon_id, TeamMember.team_id).filter(
            TeamMember.user_id == current_user.id
        ).all()
        user_team_map = {m[0]: m[1] for m in memberships}

    for h in hackathons:
        p_count = db.query(HackathonParticipant).filter(HackathonParticipant.hackathon_id == h.id).count()
        t_count = db.query(Team).filter(Team.hackathon_id == h.id).count()
        
        resp = HackathonResponse(
            id=h.id,
            slug=h.slug,
            title=h.title,
            description=h.description,
            organizer_name=h.organizer_name,
            banner_url=h.banner_url,
            start_date=h.start_date,
            end_date=h.end_date,
            registration_deadline=h.registration_deadline,
            min_team_size=h.min_team_size,
            max_team_size=h.max_team_size,
            required_skills=h.required_skills or [],
            categories=h.categories or [],
            rules=h.rules,
            status=h.status,
            participants_count=p_count,
            teams_count=t_count,
            is_registered=(h.id in user_registered_hackathons),
            user_team_id=user_team_map.get(h.id),
            created_at=h.created_at
        )
        results.append(resp)
    return results

@router.get("/{hackathon_id}", response_model=HackathonResponse)
def get_hackathon(
    hackathon_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    p_count = db.query(HackathonParticipant).filter(HackathonParticipant.hackathon_id == h.id).count()
    t_count = db.query(Team).filter(Team.hackathon_id == h.id).count()

    is_reg = False
    team_id = None
    if current_user:
        part = db.query(HackathonParticipant).filter(
            HackathonParticipant.hackathon_id == h.id,
            HackathonParticipant.user_id == current_user.id
        ).first()
        is_reg = bool(part)
        mem = db.query(TeamMember).filter(
            TeamMember.hackathon_id == h.id,
            TeamMember.user_id == current_user.id
        ).first()
        if mem:
            team_id = mem.team_id

    return HackathonResponse(
        id=h.id,
        slug=h.slug,
        title=h.title,
        description=h.description,
        organizer_name=h.organizer_name,
        banner_url=h.banner_url,
        start_date=h.start_date,
        end_date=h.end_date,
        registration_deadline=h.registration_deadline,
        min_team_size=h.min_team_size,
        max_team_size=h.max_team_size,
        required_skills=h.required_skills or [],
        categories=h.categories or [],
        rules=h.rules,
        status=h.status,
        participants_count=p_count,
        teams_count=t_count,
        is_registered=is_reg,
        user_team_id=team_id,
        created_at=h.created_at
    )

@router.post("/{hackathon_id}/register", status_code=status.HTTP_201_CREATED)
def register_for_hackathon(
    hackathon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if h.status == "ended":
        raise HTTPException(status_code=400, detail="Registration is closed. Hackathon has ended.")

    existing = db.query(HackathonParticipant).filter(
        HackathonParticipant.hackathon_id == hackathon_id,
        HackathonParticipant.user_id == current_user.id
    ).first()
    if existing:
        return {"message": "You are already registered for this hackathon", "registered": True}

    participant = HackathonParticipant(
        hackathon_id=hackathon_id,
        user_id=current_user.id,
        role_in_hackathon="participant"
    )
    db.add(participant)
    log_activity(
        db=db,
        action="hackathon.registered",
        actor_id=current_user.id,
        hackathon_id=hackathon_id,
        details={"hackathon_title": h.title}
    )
    db.commit()
    return {"message": "Successfully registered for hackathon", "registered": True}

@router.post("", response_model=HackathonResponse, status_code=status.HTTP_201_CREATED)
def create_hackathon(
    hackathon_in: HackathonCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    existing = db.query(Hackathon).filter(Hackathon.slug == hackathon_in.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="A hackathon with this slug already exists")

    h = Hackathon(
        slug=hackathon_in.slug,
        title=hackathon_in.title,
        description=hackathon_in.description,
        organizer_name=hackathon_in.organizer_name,
        banner_url=hackathon_in.banner_url,
        start_date=hackathon_in.start_date,
        end_date=hackathon_in.end_date,
        registration_deadline=hackathon_in.registration_deadline,
        min_team_size=hackathon_in.min_team_size,
        max_team_size=hackathon_in.max_team_size,
        required_skills=hackathon_in.required_skills,
        categories=hackathon_in.categories,
        rules=hackathon_in.rules,
        status="ongoing"
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return HackathonResponse.model_validate(h)

