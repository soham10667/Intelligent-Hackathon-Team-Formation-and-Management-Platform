import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, 
    UniqueConstraint, Index, func, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    college_org = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")
    role = Column(String(50), default="participant", index=True)  # participant, organizer, admin
    
    avatar_url = Column(String(500), nullable=True)
    headline = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    experience_level = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Advanced, Expert
    preferred_role = Column(String(100), default="Full Stack Developer")  # Frontend, Backend, Full Stack, UI/UX, AI/ML, DevOps, Mobile
    availability_hours_per_week = Column(Integer, default=20)
    preferred_working_hours = Column(String(50), default="Flexible")  # Morning, Afternoon, Evening, Night, Flexible
    
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    hackathon_participations = relationship("HackathonParticipant", back_populates="user")
    team_memberships = relationship("TeamMember", back_populates="user")
    join_requests = relationship("JoinRequest", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    proficiency = Column(Integer, default=3)  # 1 to 5 scale
    category = Column(String(50), default="general")  # frontend, backend, ml, devops, design, mobile
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="skills")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'skill_name', name='uq_user_skill'),
    )


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    organizer_name = Column(String(255), nullable=False)
    banner_url = Column(String(500), nullable=True)
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=False)
    
    min_team_size = Column(Integer, default=2)
    max_team_size = Column(Integer, default=4)
    
    required_skills = Column(JSON, default=list)  # e.g. ["Python", "React", "Docker"]
    categories = Column(JSON, default=list)  # e.g. ["AI/ML", "Web3", "FinTech"]
    rules = Column(Text, nullable=True)
    status = Column(String(50), default="ongoing", index=True)  # draft, upcoming, ongoing, ended
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    participants = relationship("HackathonParticipant", back_populates="hackathon", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="hackathon", cascade="all, delete-orphan")


class HackathonParticipant(Base):
    __tablename__ = "hackathon_participants"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_in_hackathon = Column(String(50), default="participant")
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    hackathon = relationship("Hackathon", back_populates="participants")
    user = relationship("User", back_populates="hackathon_participations")

    __table_args__ = (
        UniqueConstraint('hackathon_id', 'user_id', name='uq_hackathon_participant'),
    )


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General")
    
    leader_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    min_size = Column(Integer, default=2)
    max_size = Column(Integer, default=4)
    
    required_skills = Column(JSON, default=list)  # Target skills team wants to acquire
    preferred_roles = Column(JSON, default=list)  # Roles team is recruiting
    is_visible = Column(Boolean, default=True, index=True)
    status = Column(String(50), default="recruiting", index=True)  # recruiting, full, archived, dissolved
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    hackathon = relationship("Hackathon", back_populates="teams")
    leader = relationship("User", foreign_keys=[leader_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    join_requests = relationship("JoinRequest", back_populates="team", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="team", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('hackathon_id', 'name', name='uq_team_hackathon_name'),
    )


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="member")  # leader, member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

    __table_args__ = (
        # CRITICAL CONSTRAINTS FOR RACE-PROOF AND CONSISTENCY INTEGRITY
        UniqueConstraint('hackathon_id', 'user_id', name='uq_user_hackathon_team'),
        UniqueConstraint('team_id', 'user_id', name='uq_team_member_user'),
    )


class JoinRequest(Base):
    __tablename__ = "join_requests"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, accepted, rejected, cancelled, expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    team = relationship("Team", back_populates="join_requests")
    user = relationship("User", back_populates="join_requests")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    invite_code = Column(String(64), unique=True, index=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    max_uses = Column(Integer, default=1)
    uses_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="invitations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(128), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String(255), nullable=False)
    response_code = Column(Integer, nullable=False)
    response_body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

