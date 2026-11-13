import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    User, Hackathon, Team, TeamMember, 
    JoinRequest, Invitation, AuditLog
)
from app.schemas.schemas import (
    PlatformStatsResponse, AdminAnalyticsResponse, 
    UserResponse, AuditLogResponse
)
from app.api.deps import get_current_admin

router = APIRouter(tags=["Admin & Analytics"])

# ----------------- PUBLIC STATS FOR LANDING PAGE -----------------
@router.get("/stats/platform", response_model=PlatformStatsResponse)
def get_public_platform_stats(db: Session = Depends(get_db)):
    """
    Returns real database statistics for the public landing page.
    No hardcoded fake numbers.
    """
    total_participants = db.query(User).filter(User.is_active == True).count()
    active_hackathons = db.query(Hackathon).filter(Hackathon.status == "ongoing").count()
    teams_created = db.query(Team).count()
    successful_matches = db.query(TeamMember).filter(TeamMember.role == "member").count()

    return PlatformStatsResponse(
        total_participants=total_participants,
        active_hackathons=active_hackathons,
        teams_created=teams_created,
        successful_team_matches=successful_matches
    )

# ----------------- ADMIN ANALYTICS -----------------
@router.get("/admin/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    total_hackathons = db.query(Hackathon).count()
    total_teams = db.query(Team).count()
    teams_recruiting = db.query(Team).filter(Team.status == "recruiting").count()
    teams_full = db.query(Team).filter(Team.status == "full").count()
    pending_requests = db.query(JoinRequest).filter(JoinRequest.status == "pending").count()
    successful_matches = db.query(TeamMember).filter(TeamMember.role == "member").count()
    
    total_members = db.query(TeamMember).count()
    avg_size = round(total_members / max(total_teams, 1), 2)
    
    suspicious_invites = db.query(AuditLog).filter(
        AuditLog.action.ilike("%invalid_invite%")
    ).count()

    return AdminAnalyticsResponse(
        total_users=total_users,
        total_hackathons=total_hackathons,
        total_teams=total_teams,
        average_team_size=avg_size,
        teams_recruiting=teams_recruiting,
        teams_full=teams_full,
        pending_join_requests=pending_requests,
        successful_matches=successful_matches,
        suspicious_invite_attempts=suspicious_invites
    )

@router.get("/admin/participants", response_model=List[UserResponse])
def get_admin_participants(
    q: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(User)
    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]

@router.get("/admin/audit-logs", response_model=List[AuditLogResponse])
def get_admin_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]

@router.get("/admin/export/teams")
def export_teams_csv(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Exports all team information as a CSV spreadsheet.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Team ID", "Team Name", "Hackathon ID", "Category", 
        "Leader Name", "Leader Email", "Current Members", 
        "Max Capacity", "Status", "Created At"
    ])

    teams = db.query(Team).order_by(Team.created_at.desc()).all()
    for t in teams:
        member_count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
        writer.writerow([
            t.id,
            t.name,
            t.hackathon_id,
            t.category,
            t.leader.full_name if t.leader else "Unknown",
            t.leader.email if t.leader else "Unknown",
            member_count,
            t.max_size,
            t.status,
            t.created_at.isoformat() if t.created_at else ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hackathon_teams_export.csv"}
    )

