from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import (
    Team, TeamMember, Hackathon, HackathonParticipant, 
    JoinRequest, Invitation, User
)
from app.services.audit_service import log_activity
from app.services.notification_service import create_and_send_notification
from app.websocket.manager import manager

class TeamService:

    @staticmethod
    def create_team(db: Session, user: User, hackathon_id: int, team_data: Dict[str, Any]) -> Team:
        # 1. Verify Hackathon exists and is active
        hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
        if not hackathon:
            raise HTTPException(status_code=404, detail="Hackathon not found")
        if hackathon.status == "ended":
            raise HTTPException(status_code=400, detail="Hackathon has already ended")

        # 2. Verify User is registered for this hackathon
        participation = db.query(HackathonParticipant).filter(
            HackathonParticipant.hackathon_id == hackathon_id,
            HackathonParticipant.user_id == user.id
        ).first()
        if not participation:
            raise HTTPException(status_code=403, detail="You must register for the hackathon before creating a team")

        # 3. Verify User is not already in an active team for this hackathon
        existing_membership = db.query(TeamMember).filter(
            TeamMember.hackathon_id == hackathon_id,
            TeamMember.user_id == user.id
        ).first()
        if existing_membership:
            raise HTTPException(status_code=409, detail="You already belong to a team in this hackathon")

        # 4. Check team name uniqueness within this hackathon
        team_name = team_data.get("name", "").strip()
        if not team_name:
            raise HTTPException(status_code=400, detail="Team name is required")
        
        existing_team = db.query(Team).filter(
            Team.hackathon_id == hackathon_id,
            func.lower(Team.name) == func.lower(team_name)
        ).first()
        if existing_team:
            raise HTTPException(status_code=409, detail=f"A team named '{team_name}' already exists in this hackathon")

        # 5. Validate capacity limits
        min_size = team_data.get("min_size", hackathon.min_team_size)
        max_size = team_data.get("max_size", hackathon.max_team_size)
        if max_size < min_size:
            raise HTTPException(status_code=400, detail="max_size cannot be less than min_size")
        if max_size > hackathon.max_team_size:
            raise HTTPException(status_code=400, detail=f"max_size cannot exceed hackathon limit ({hackathon.max_team_size})")

        # 6. Create Team and Leader Membership atomically
        new_team = Team(
            hackathon_id=hackathon_id,
            name=team_name,
            description=team_data.get("description"),
            category=team_data.get("category", "General"),
            leader_id=user.id,
            min_size=min_size,
            max_size=max_size,
            required_skills=team_data.get("required_skills", []),
            preferred_roles=team_data.get("preferred_roles", []),
            is_visible=team_data.get("is_visible", True),
            status="recruiting"
        )
        db.add(new_team)
        db.flush()  # assign new_team.id

        leader_member = TeamMember(
            team_id=new_team.id,
            user_id=user.id,
            hackathon_id=hackathon_id,
            role="leader"
        )
        db.add(leader_member)

        # Audit log
        log_activity(
            db=db,
            action="team.created",
            actor_id=user.id,
            hackathon_id=hackathon_id,
            team_id=new_team.id,
            details={"team_name": new_team.name, "category": new_team.category}
        )

        db.commit()
        db.refresh(new_team)
        return new_team

    @staticmethod
    def create_join_request(db: Session, user: User, team_id: int, message: Optional[str] = None) -> JoinRequest:
        # Lock team row to read capacity safely
        team = db.query(Team).with_for_update().filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.status in ["full", "dissolved", "archived"]:
            raise HTTPException(status_code=409, detail=f"This team is currently {team.status} and not accepting requests")

        # Verify participation
        participation = db.query(HackathonParticipant).filter(
            HackathonParticipant.hackathon_id == team.hackathon_id,
            HackathonParticipant.user_id == user.id
        ).first()
        if not participation:
            raise HTTPException(status_code=403, detail="You must register for this hackathon first")

        # Verify not already in ANY team for this hackathon
        existing_membership = db.query(TeamMember).filter(
            TeamMember.hackathon_id == team.hackathon_id,
            TeamMember.user_id == user.id
        ).first()
        if existing_membership:
            raise HTTPException(status_code=409, detail="You are already a member of a team in this hackathon")

        # Verify capacity
        member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if member_count >= team.max_size:
            team.status = "full"
            db.commit()
            raise HTTPException(status_code=409, detail="Team has reached its maximum capacity")

        # Check existing pending request
        pending_req = db.query(JoinRequest).filter(
            JoinRequest.team_id == team.id,
            JoinRequest.user_id == user.id,
            JoinRequest.status == "pending"
        ).first()
        if pending_req:
            raise HTTPException(status_code=409, detail="You already have an active pending join request for this team")

        # Create JoinRequest
        join_req = JoinRequest(
            team_id=team.id,
            user_id=user.id,
            hackathon_id=team.hackathon_id,
            message=message,
            status="pending"
        )
        db.add(join_req)

        log_activity(
            db=db,
            action="join_request.created",
            actor_id=user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            details={"message": message}
        )
        db.commit()
        db.refresh(join_req)
        return join_req

    @staticmethod
    def accept_join_request(db: Session, leader_user: User, request_id: int) -> TeamMember:
        """
        CRITICAL RACE-PROOF OPERATION:
        Uses explicit row-level locking (SELECT ... FOR UPDATE) on the Team row.
        Atomically validates available capacity, verifies user single-team invariant,
        inserts membership, updates team state, and updates the join request.
        """
        # Fetch request
        req = db.query(JoinRequest).filter(JoinRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        if req.status != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

        # ACQUIRE EXCLUSIVE ROW LOCK ON THE TEAM
        team = db.query(Team).with_for_update().filter(Team.id == req.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team no longer exists")
        
        # Verify authorization
        if team.leader_id != leader_user.id and leader_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the team leader can accept join requests")

        # ATOMIC CAPACITY CHECK INSIDE TRANSACTION
        current_members_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if current_members_count >= team.max_size:
            team.status = "full"
            req.status = "expired"
            req.responded_at = datetime.now(timezone.utc)
            db.commit()
            raise HTTPException(status_code=409, detail="Team is already full. Cannot accept more members.")

        # ATOMIC CHECK: Verify applicant is not already in another team
        applicant_existing = db.query(TeamMember).filter(
            TeamMember.hackathon_id == team.hackathon_id,
            TeamMember.user_id == req.user_id
        ).first()
        if applicant_existing:
            req.status = "cancelled"
            req.responded_at = datetime.now(timezone.utc)
            db.commit()
            raise HTTPException(status_code=409, detail="Participant has already joined another team in this hackathon")

        # INSERT MEMBERSHIP
        new_member = TeamMember(
            team_id=team.id,
            user_id=req.user_id,
            hackathon_id=team.hackathon_id,
            role="member",
            joined_at=datetime.now(timezone.utc)
        )
        db.add(new_member)

        # UPDATE REQUEST STATUS
        req.status = "accepted"
        req.responded_at = datetime.now(timezone.utc)

        # UPDATE TEAM STATUS IF FULL
        if current_members_count + 1 >= team.max_size:
            team.status = "full"

        # AUDIT LOGS
        log_activity(
            db=db,
            action="join_request.accepted",
            actor_id=leader_user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            target_user_id=req.user_id,
            details={"request_id": req.id}
        )
        log_activity(
            db=db,
            action="member.joined",
            actor_id=leader_user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            target_user_id=req.user_id,
            details={"role": "member", "via": "join_request"}
        )

        db.commit()
        db.refresh(new_member)
        return new_member

    @staticmethod
    def reject_join_request(db: Session, leader_user: User, request_id: int) -> JoinRequest:
        req = db.query(JoinRequest).filter(JoinRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        if req.status != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

        team = db.query(Team).filter(Team.id == req.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != leader_user.id and leader_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the team leader can reject join requests")

        req.status = "rejected"
        req.responded_at = datetime.now(timezone.utc)

        log_activity(
            db=db,
            action="join_request.rejected",
            actor_id=leader_user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            target_user_id=req.user_id,
            details={"request_id": req.id}
        )

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def remove_member(db: Session, leader_user: User, team_id: int, user_id_to_remove: int) -> bool:
        team = db.query(Team).with_for_update().filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != leader_user.id and leader_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only team leader can remove members")
        if team.leader_id == user_id_to_remove:
            raise HTTPException(status_code=400, detail="Team leader cannot be removed. Use leave team or transfer leadership.")

        membership = db.query(TeamMember).filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user_id_to_remove
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="User is not a member of this team")

        db.delete(membership)
        
        # If team was full, mark it back to recruiting
        if team.status == "full":
            team.status = "recruiting"

        log_activity(
            db=db,
            action="member.removed",
            actor_id=leader_user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            target_user_id=user_id_to_remove
        )
        db.commit()
        return True

    @staticmethod
    def leave_team(db: Session, user: User, team_id: int) -> Dict[str, Any]:
        """
        Member leaves team.
        If leader leaves:
        - Automatically transfers leadership deterministically to the earliest joined member.
        - If last member leaves: dissolves team.
        """
        team = db.query(Team).with_for_update().filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        membership = db.query(TeamMember).filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="You are not a member of this team")

        all_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
        other_members = [m for m in all_members if m.user_id != user.id]

        db.delete(membership)
        result = {"status": "left", "team_dissolved": False, "new_leader_id": None}

        if not other_members:
            # Last member left: mark dissolved
            team.status = "dissolved"
            team.is_visible = False
            result["team_dissolved"] = True
            log_activity(
                db=db,
                action="team.dissolved",
                actor_id=user.id,
                hackathon_id=team.hackathon_id,
                team_id=team.id,
                details={"reason": "Last member left"}
            )
        elif team.leader_id == user.id:
            # Leader left: Deterministically pick earliest joined remaining member
            successor = sorted(other_members, key=lambda m: (m.joined_at, m.id))[0]
            team.leader_id = successor.user_id
            successor.role = "leader"
            result["new_leader_id"] = successor.user_id
            
            if team.status == "full":
                team.status = "recruiting"

            log_activity(
                db=db,
                action="leadership.transferred",
                actor_id=user.id,
                hackathon_id=team.hackathon_id,
                team_id=team.id,
                target_user_id=successor.user_id,
                details={"method": "deterministic_earliest_joined", "previous_leader_id": user.id}
            )
        else:
            if team.status == "full":
                team.status = "recruiting"

        log_activity(
            db=db,
            action="member.left",
            actor_id=user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id
        )

        db.commit()
        return result

    @staticmethod
    def redeem_invitation(db: Session, user: User, invite_code: str) -> TeamMember:
        """
        Atomically validates and redeems a cryptographically secure invite code.
        """
        code = invite_code.strip()
        invitation = db.query(Invitation).with_for_update().filter(
            Invitation.invite_code == code
        ).first()
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid invitation code")
        if invitation.is_revoked:
            raise HTTPException(status_code=400, detail="Invitation code has been revoked")
        now = datetime.now(timezone.utc)
        exp = invitation.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            raise HTTPException(status_code=400, detail="Invitation code has expired")
        if invitation.uses_count >= invitation.max_uses:
            raise HTTPException(status_code=400, detail="Invitation code has reached maximum usage limit")

        # Row lock team
        team = db.query(Team).with_for_update().filter(Team.id == invitation.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Associated team no longer exists")

        # Verify hackathon participation
        participation = db.query(HackathonParticipant).filter(
            HackathonParticipant.hackathon_id == team.hackathon_id,
            HackathonParticipant.user_id == user.id
        ).first()
        if not participation:
            raise HTTPException(status_code=403, detail="You must register for this hackathon before joining a team")

        # Verify not already in ANY team for this hackathon
        existing_membership = db.query(TeamMember).filter(
            TeamMember.hackathon_id == team.hackathon_id,
            TeamMember.user_id == user.id
        ).first()
        if existing_membership:
            raise HTTPException(status_code=409, detail="You already belong to a team in this hackathon")

        # Verify capacity
        member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if member_count >= team.max_size:
            team.status = "full"
            db.commit()
            raise HTTPException(status_code=409, detail="Team has already reached its maximum capacity")

        # Join team
        new_member = TeamMember(
            team_id=team.id,
            user_id=user.id,
            hackathon_id=team.hackathon_id,
            role="member",
            joined_at=datetime.now(timezone.utc)
        )
        db.add(new_member)
        invitation.uses_count += 1

        if member_count + 1 >= team.max_size:
            team.status = "full"

        log_activity(
            db=db,
            action="invitation.redeemed",
            actor_id=user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            details={"invite_code": code}
        )
        log_activity(
            db=db,
            action="member.joined",
            actor_id=user.id,
            hackathon_id=team.hackathon_id,
            team_id=team.id,
            target_user_id=user.id,
            details={"role": "member", "via": "invitation"}
        )

        db.commit()
        db.refresh(new_member)
        return new_member

