import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- TOKEN SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

# ----------------- SKILL SCHEMAS -----------------
class SkillBase(BaseModel):
    skill_name: str
    proficiency: int = Field(default=3, ge=1, le=5)
    category: str = "general"

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- USER SCHEMAS -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    college_org: Optional[str] = None
    country: Optional[str] = None
    timezone: str = "UTC"

class UserRegister(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college_org: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_role: Optional[str] = None
    availability_hours_per_week: Optional[int] = None
    preferred_working_hours: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[SkillCreate]] = None

class UserPublic(BaseModel):
    id: int
    full_name: str
    college_org: Optional[str] = None
    country: Optional[str] = None
    timezone: str
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    experience_level: str
    preferred_role: str
    availability_hours_per_week: int
    preferred_working_hours: str
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[SkillResponse] = []
    model_config = ConfigDict(from_attributes=True)

class UserResponse(UserPublic):
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime.datetime

# ----------------- HACKATHON SCHEMAS -----------------
class HackathonBase(BaseModel):
    title: str
    slug: str
    description: str
    organizer_name: str
    banner_url: Optional[str] = None
    start_date: datetime.datetime
    end_date: datetime.datetime
    registration_deadline: datetime.datetime
    min_team_size: int = 2
    max_team_size: int = 4
    required_skills: List[str] = []
    categories: List[str] = []
    rules: Optional[str] = None

class HackathonCreate(HackathonBase):
    pass

class HackathonResponse(HackathonBase):
    id: int
    status: str
    participants_count: int = 0
    teams_count: int = 0
    is_registered: bool = False
    user_team_id: Optional[int] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- TEAM MEMBER SCHEMAS -----------------
class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime.datetime
    user: UserPublic
    model_config = ConfigDict(from_attributes=True)

# ----------------- TEAM SCHEMAS -----------------
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "General"
    min_size: int = 2
    max_size: int = 4
    required_skills: List[str] = []
    preferred_roles: List[str] = []
    is_visible: bool = True

class TeamCreate(TeamBase):
    hackathon_id: Optional[int] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    is_visible: Optional[bool] = None

class TeamResponse(TeamBase):
    id: int
    hackathon_id: int
    leader_id: int
    status: str
    current_members_count: int = 0
    available_seats: int = 0
    created_at: datetime.datetime
    skills_covered: List[str] = []
    leader: UserPublic
    model_config = ConfigDict(from_attributes=True)

class TeamDetailResponse(TeamResponse):
    members: List[TeamMemberResponse] = []
    hackathon: HackathonBase

# ----------------- JOIN REQUEST SCHEMAS -----------------
class JoinRequestCreate(BaseModel):
    message: Optional[str] = None

class JoinRequestResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    hackathon_id: int
    message: Optional[str]
    status: str
    created_at: datetime.datetime
    responded_at: Optional[datetime.datetime]
    user: UserPublic
    team_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- INVITATION SCHEMAS -----------------
class InvitationCreate(BaseModel):
    max_uses: int = 1
    expires_in_hours: int = 72

class InvitationResponse(BaseModel):
    id: int
    team_id: int
    hackathon_id: int
    invite_code: str
    created_by: int
    max_uses: int
    uses_count: int
    expires_at: datetime.datetime
    is_revoked: bool
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class InvitationRedeemRequest(BaseModel):
    invite_code: str

# ----------------- RECOMMENDATION & MATCHING SCHEMAS -----------------
class TeammateRecommendation(BaseModel):
    user: UserPublic
    compatibility_score: float
    score_breakdown: Dict[str, float]
    reasons: List[str]
    matching_skills: List[str]
    missing_skills_covered: List[str]

class SkillGapReport(BaseModel):
    team_id: int
    team_name: str
    required_skills: List[str]
    covered_skills: List[Dict[str, Any]]
    missing_skills: List[str]
    underrepresented_skills: List[str]
    recommended_roles: List[str]
    team_skills_breakdown: Dict[str, int]

class TeamCompatibilityReport(BaseModel):
    team_id: int
    overall_score: float
    skill_diversity_score: float
    role_coverage_score: float
    timezone_overlap_score: float
    availability_score: float
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]
    scoring_formula_explanation: str

# ----------------- NOTIFICATION SCHEMAS -----------------
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    link: Optional[str]
    is_read: bool
    created_at: datetime.datetime
    metadata_json: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

# ----------------- AUDIT LOG SCHEMAS -----------------
class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int]
    hackathon_id: Optional[int]
    team_id: Optional[int]
    action: str
    target_user_id: Optional[int]
    details: Dict[str, Any]
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- STATS & ANALYTICS SCHEMAS -----------------
class PlatformStatsResponse(BaseModel):
    total_participants: int
    active_hackathons: int
    teams_created: int
    successful_team_matches: int

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_hackathons: int
    total_teams: int
    average_team_size: float
    teams_recruiting: int
    teams_full: int
    pending_join_requests: int
    successful_matches: int
    suspicious_invite_attempts: int
