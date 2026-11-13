from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, and_
from app.core.database import get_db
from app.core.security import generate_secure_invite_code
from app.models.models import (
    Team, TeamMember, Hackathon, JoinRequest, 
    Invitation, AuditLog, User, UserSkill
)
from app.schemas.schemas import (
    TeamResponse, TeamDetailResponse, TeamCreate, TeamUpdate,
    TeamMemberResponse, JoinRequestResponse, JoinRequestCreate,
    InvitationResponse, InvitationCreate, InvitationRedeemRequest,
    TeammateRecommendation, SkillGapReport, TeamCompatibilityReport,
    AuditLogResponse, UserPublic
)
from app.api.deps import get_current_user, get_optional_current_user
from app.services.team_service import TeamService
from app.services.matching_service import MatchingService
from app.services.audit_service import log_activity
from app.websocket.manager import manager

router = APIRouter(tags=["Teams & Teammates"])

def build_team_responses(teams: List[Team], db: Session) -> List[TeamResponse]:
    if not teams:
        return []
    team_ids = [t.id for t in teams]
    
    # Single batch query for member counts
    counts_query = db.query(
        TeamMember.team_id, func.count(TeamMember.id)
    ).filter(TeamMember.team_id.in_(team_ids)).group_by(TeamMember.team_id).all()
    count_map = {tid: count for tid, count in counts_query}

    # Single batch query for covered skills
    skills_query = db.query(
        TeamMember.team_id, UserSkill.skill_name
    ).join(UserSkill, TeamMember.user_id == UserSkill.user_id).filter(
        TeamMember.team_id.in_(team_ids)
    ).distinct().all()
    
    skills_map = {}
    for tid, sname in skills_query:
        if tid not in skills_map:
            skills_map[tid] = []
        skills_map[tid].append(sname)

    results = []
    for t in teams:
        c = count_map.get(t.id, 0)
        results.append(TeamResponse(
            id=t.id,
            hackathon_id=t.hackathon_id,
            name=t.name,
            description=t.description,
            category=t.category,
            leader_id=t.leader_id,
            min_size=t.min_size,
            max_size=t.max_size,
            required_skills=t.required_skills or [],
            preferred_roles=t.preferred_roles or [],
            is_visible=t.is_visible,
            status=t.status,
            current_members_count=c,
            available_seats=max(0, t.max_size - c),
            skills_covered=skills_map.get(t.id, []),
            created_at=t.created_at,
            leader=UserPublic.model_validate(t.leader)
        ))
    return results

def build_team_response(t: Team, db: Session) -> TeamResponse:
    res = build_team_responses([t], db)
    return res[0]

# ----------------- HACKATHON TEAMS -----------------
@router.post("/hackathons/{hackathon_id}/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    hackathon_id: int,
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team_dict = team_in.model_dump()
    team = TeamService.create_team(db, current_user, hackathon_id, team_dict)
    resp = build_team_response(team, db)
    
    # Broadcast to live discovery board subscribers
    await manager.broadcast_discovery({
        "event": "team_created",
        "team": resp.model_dump(mode="json")
    })
    return resp

@router.get("/hackathons/{hackathon_id}/teams", response_model=List[TeamResponse])
def list_hackathon_teams(
    hackathon_id: int,
    db: Session = Depends(get_db)
):
    teams = db.query(Team).filter(
        Team.hackathon_id == hackathon_id,
        Team.status.in_(["recruiting", "full"])
    ).order_by(Team.created_at.desc()).all()
    return build_team_responses(teams, db)

# ----------------- TEAM DISCOVERY BOARD -----------------
@router.get("/teams/discovery", response_model=List[TeamResponse])
def discover_teams(
    hackathon_id: Optional[int] = Query(None, description="Filter by hackathon"),
    q: Optional[str] = Query(None, description="Search team name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skill: Optional[str] = Query(None, description="Filter by skill required"),
    only_open_seats: bool = Query(True, description="Only show teams with open seats"),
    sort_by: str = Query("newest", description="Sort by newest, seats, size"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Team).filter(Team.is_visible == True)
    
    if only_open_seats:
        query = query.filter(Team.status == "recruiting")
    else:
        query = query.filter(Team.status.in_(["recruiting", "full"]))

    if hackathon_id:
        query = query.filter(Team.hackathon_id == hackathon_id)
    if category and category != "All":
        query = query.filter(Team.category == category)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(or_(
            Team.name.ilike(search_pattern),
            Team.description.ilike(search_pattern)
        ))

    # High performance: Apply SQL limit & offset directly and eager-load leader to avoid N+1 queries
    teams = query.options(joinedload(Team.leader)).order_by(Team.created_at.desc()).offset(offset).limit(limit).all()
    results = build_team_responses(teams, db)

    if only_open_seats:
        results = [r for r in results if r.available_seats > 0]
    if skill:
        results = [r for r in results if skill.lower() in [s.lower() for s in r.required_skills]]
    if sort_by == "seats":
        results.sort(key=lambda x: x.available_seats, reverse=True)
    elif sort_by == "size":
        results.sort(key=lambda x: x.current_members_count, reverse=True)

    return results

# ----------------- TEAM DETAILS & UPDATES -----------------
@router.get("/teams/{team_id}", response_model=TeamDetailResponse)
def get_team_details(team_id: int, db: Session = Depends(get_db)):
    t = db.query(Team).filter(Team.id == team_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Team not found")

    base_resp = build_team_response(t, db)
    members = db.query(TeamMember).filter(TeamMember.team_id == t.id).all()
    members_resp = [
        TeamMemberResponse(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            user=UserPublic.model_validate(m.user)
        ) for m in members
    ]

    return TeamDetailResponse(
        **base_resp.model_dump(),
        members=members_resp,
        hackathon=t.hackathon
    )

@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_in: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only team leader can update team details")

    for field, val in team_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(team, field, val)

    log_activity(
        db=db,
        action="team.updated",
        actor_id=current_user.id,
        hackathon_id=team.hackathon_id,
        team_id=team.id,
        details={"updated_fields": list(team_in.model_dump(exclude_unset=True).keys())}
    )
    db.commit()
    db.refresh(team)
    resp = build_team_response(team, db)
    
    await manager.broadcast_discovery({
        "event": "team_updated",
        "team": resp.model_dump(mode="json")
    })
    return resp

# ----------------- JOIN REQUESTS -----------------
@router.post("/teams/{team_id}/join-requests", response_model=JoinRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_to_join_team(
    team_id: int,
    req_in: JoinRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    join_req = TeamService.create_join_request(db, current_user, team_id, req_in.message)
    resp = JoinRequestResponse(
        id=join_req.id,
        team_id=join_req.team_id,
        user_id=join_req.user_id,
        hackathon_id=join_req.hackathon_id,
        message=join_req.message,
        status=join_req.status,
        created_at=join_req.created_at,
        responded_at=join_req.responded_at,
        user=UserPublic.model_validate(current_user),
        team_name=join_req.team.name
    )

    # Notify team leader via WebSocket
    await manager.send_personal_message({
        "event": "new_join_request",
        "request": resp.model_dump(mode="json"),
        "message": f"{current_user.full_name} requested to join your team '{join_req.team.name}'"
    }, join_req.team.leader_id)

    return resp

@router.get("/teams/{team_id}/requests", response_model=List[JoinRequestResponse])
def get_team_join_requests(
    team_id: int,
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only team leader can view join requests")

    query = db.query(JoinRequest).filter(JoinRequest.team_id == team_id)
    if status_filter:
        query = query.filter(JoinRequest.status == status_filter)
    requests = query.order_by(JoinRequest.created_at.desc()).all()

    return [
        JoinRequestResponse(
            id=r.id,
            team_id=r.team_id,
            user_id=r.user_id,
            hackathon_id=r.hackathon_id,
            message=r.message,
            status=r.status,
            created_at=r.created_at,
            responded_at=r.responded_at,
            user=UserPublic.model_validate(r.user),
            team_name=team.name
        ) for r in requests
    ]

@router.get("/users/me/join-requests", response_model=List[JoinRequestResponse])
def get_my_join_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(JoinRequest).filter(
        JoinRequest.user_id == current_user.id
    ).order_by(JoinRequest.created_at.desc()).all()

    return [
        JoinRequestResponse(
            id=r.id,
            team_id=r.team_id,
            user_id=r.user_id,
            hackathon_id=r.hackathon_id,
            message=r.message,
            status=r.status,
            created_at=r.created_at,
            responded_at=r.responded_at,
            user=UserPublic.model_validate(r.user),
            team_name=r.team.name if r.team else None
        ) for r in requests
    ]

@router.post("/teams/{team_id}/requests/{request_id}/accept", response_model=TeamMemberResponse)
async def accept_join_request(
    team_id: int,
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = TeamService.accept_join_request(db, current_user, request_id)
    resp = TeamMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user=UserPublic.model_validate(member.user)
    )

    # Notify accepted applicant
    await manager.send_personal_message({
        "event": "join_request_accepted",
        "team_id": team_id,
        "team_name": member.team.name,
        "message": f"Congratulations! You were accepted into team '{member.team.name}'"
    }, member.user_id)

    # Broadcast discovery update
    team_resp = build_team_response(member.team, db)
    await manager.broadcast_discovery({
        "event": "team_updated",
        "team": team_resp.model_dump(mode="json")
    })

    return resp

@router.post("/teams/{team_id}/requests/{request_id}/reject", response_model=JoinRequestResponse)
async def reject_join_request(
    team_id: int,
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = TeamService.reject_join_request(db, current_user, request_id)
    
    # Notify rejected applicant
    await manager.send_personal_message({
        "event": "join_request_rejected",
        "team_id": team_id,
        "message": f"Your request to join '{req.team.name}' was not accepted."
    }, req.user_id)

    return JoinRequestResponse(
        id=req.id,
        team_id=req.team_id,
        user_id=req.user_id,
        hackathon_id=req.hackathon_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        responded_at=req.responded_at,
        user=UserPublic.model_validate(req.user),
        team_name=req.team.name
    )

# ----------------- MEMBERSHIP & LEAVING -----------------
@router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    TeamService.remove_member(db, current_user, team_id, user_id)
    
    await manager.send_personal_message({
        "event": "member_removed",
        "team_id": team_id,
        "message": "You were removed from the team by the team leader."
    }, user_id)

    team = db.query(Team).filter(Team.id == team_id).first()
    if team:
        team_resp = build_team_response(team, db)
        await manager.broadcast_discovery({
            "event": "team_updated",
            "team": team_resp.model_dump(mode="json")
        })

    return {"message": "Member removed successfully"}

@router.post("/teams/{team_id}/leave")
async def leave_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = TeamService.leave_team(db, current_user, team_id)
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if team and not result.get("team_dissolved"):
        team_resp = build_team_response(team, db)
        await manager.broadcast_discovery({
            "event": "team_updated",
            "team": team_resp.model_dump(mode="json")
        })
    else:
        await manager.broadcast_discovery({
            "event": "team_dissolved",
            "team_id": team_id
        })

    return result

# ----------------- INVITATIONS -----------------
@router.post("/teams/{team_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_team_invitation(
    team_id: int,
    inv_in: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only team leader can create invitations")

    code = generate_secure_invite_code(prefix="HACK")
    expires_at = datetime.now(timezone.utc) + timedelta(hours=inv_in.expires_in_hours)

    invitation = Invitation(
        team_id=team.id,
        hackathon_id=team.hackathon_id,
        invite_code=code,
        created_by=current_user.id,
        max_uses=inv_in.max_uses,
        uses_count=0,
        expires_at=expires_at,
        is_revoked=False
    )
    db.add(invitation)
    
    log_activity(
        db=db,
        action="invitation.created",
        actor_id=current_user.id,
        hackathon_id=team.hackathon_id,
        team_id=team.id,
        details={"invite_code": code, "expires_at": expires_at.isoformat()}
    )
    db.commit()
    db.refresh(invitation)
    return InvitationResponse.model_validate(invitation)

@router.get("/teams/{team_id}/invitations", response_model=List[InvitationResponse])
def get_team_invitations(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only team leader can view invitations")

    invitations = db.query(Invitation).filter(
        Invitation.team_id == team_id,
        Invitation.is_revoked == False
    ).order_by(Invitation.created_at.desc()).all()
    return [InvitationResponse.model_validate(i) for i in invitations]

@router.delete("/invitations/{invitation_id}")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    team = db.query(Team).filter(Team.id == invitation.team_id).first()
    if team.leader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only team leader can revoke invitations")

    invitation.is_revoked = True
    log_activity(
        db=db,
        action="invitation.revoked",
        actor_id=current_user.id,
        hackathon_id=invitation.hackathon_id,
        team_id=invitation.team_id,
        details={"invitation_id": invitation_id}
    )
    db.commit()
    return {"message": "Invitation code revoked successfully"}

@router.post("/invitations/redeem", response_model=TeamMemberResponse)
async def redeem_invitation_code(
    redeem_in: InvitationRedeemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = TeamService.redeem_invitation(db, current_user, redeem_in.invite_code)
    resp = TeamMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user=UserPublic.model_validate(member.user)
    )

    # Broadcast discovery update
    team_resp = build_team_response(member.team, db)
    await manager.broadcast_discovery({
        "event": "team_updated",
        "team": team_resp.model_dump(mode="json")
    })

    return resp

# ----------------- INTELLIGENT MATCHING & ANALYSIS -----------------
@router.get("/teams/{team_id}/recommendations", response_model=List[TeammateRecommendation])
def get_teammate_recommendations(
    team_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return MatchingService.recommend_teammates_for_team(db, team, limit=limit)

@router.get("/teams/{team_id}/skill-gap", response_model=SkillGapReport)
def get_team_skill_gap_report(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return MatchingService.get_skill_gap_report(db, team)

@router.get("/teams/{team_id}/compatibility", response_model=TeamCompatibilityReport)
def get_team_compatibility_report(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return MatchingService.get_team_compatibility(db, team)

@router.get("/teams/{team_id}/audit-logs", response_model=List[AuditLogResponse])
def get_team_audit_logs(
    team_id: int,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    logs = db.query(AuditLog).filter(
        AuditLog.team_id == team_id
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]

