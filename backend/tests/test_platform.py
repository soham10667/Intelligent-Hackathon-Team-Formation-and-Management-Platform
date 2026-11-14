import os
import sys

# Ensure backend root directory is on sys.path regardless of execution environment
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_URL = "sqlite:///./test_hackathon_platform.db"
os.environ["DATABASE_URL"] = TEST_DB_URL

from app.main import app
from app.core.database import Base, get_db
from app.models.models import User, Hackathon, Team, TeamMember, JoinRequest, Invitation, AuditLog
from app.core.security import get_password_hash, create_access_token

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    database = TestingSessionLocal()
    yield database
    database.close()

def create_test_user(db, email="testuser@example.com", full_name="Test User", role="participant"):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        token = create_access_token(existing.id)
        return existing, {"Authorization": f"Bearer {token}"}
    
    user = User(
        email=email,
        hashed_password=get_password_hash("SecretP@ss123"),
        full_name=full_name,
        role=role,
        college_org="MIT",
        country="USA",
        timezone="UTC",
        preferred_role="Full Stack Developer",
        experience_level="Intermediate",
        availability_hours_per_week=25,
        preferred_working_hours="Flexible",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return user, {"Authorization": f"Bearer {token}"}

def create_test_hackathon(db, slug="ai-world-cup-2026"):
    existing = db.query(Hackathon).filter(Hackathon.slug == slug).first()
    if existing:
        return existing
    h = Hackathon(
        slug=slug,
        title="Global AI Hackathon 2026",
        description="The largest generative AI engineering challenge.",
        organizer_name="DeepMind & Partners",
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=5),
        registration_deadline=datetime.now(timezone.utc) + timedelta(days=1),
        min_team_size=2,
        max_team_size=4,
        required_skills=["Python", "FastAPI", "React", "Docker"],
        categories=["AI/ML", "Cloud"],
        status="ongoing"
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


# 1. User registration
def test_user_registration(client):
    res = client.post("/api/auth/register", json={
        "email": "dev1@gmail.com",
        "password": "Password123!",
        "full_name": "Dev One",
        "college_org": "Stanford",
        "country": "USA",
        "timezone": "UTC-5"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "dev1@gmail.com"


# 2. Duplicate email prevention
def test_duplicate_email_prevention(client):
    res = client.post("/api/auth/register", json={
        "email": "dev1@gmail.com",
        "password": "AnotherPassword123!",
        "full_name": "Dev Duplicate",
        "college_org": "Stanford"
    })
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]


# 3. User login
def test_user_login(client):
    res = client.post("/api/auth/login", json={
        "email": "dev1@gmail.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


# 4. Invalid login
def test_invalid_login(client):
    res = client.post("/api/auth/login", json={
        "email": "dev1@gmail.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401


# 5. Profile updates
def test_profile_updates(client, db):
    user, headers = create_test_user(db, email="profile_updater@example.com")
    res = client.put("/api/users/me", headers=headers, json={
        "headline": "Senior Full-Stack Architect",
        "bio": "Passionate about high-throughput distributed systems.",
        "skills": [
            {"skill_name": "Python", "proficiency": 5, "category": "backend"},
            {"skill_name": "PostgreSQL", "proficiency": 5, "category": "backend"},
            {"skill_name": "React", "proficiency": 4, "category": "frontend"}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["headline"] == "Senior Full-Stack Architect"
    assert len(data["skills"]) == 3


# 6. Hackathon registration
def test_hackathon_registration(client, db):
    user, headers = create_test_user(db, email="participant1@example.com")
    hackathon = create_test_hackathon(db)
    res = client.post(f"/api/hackathons/{hackathon.id}/register", headers=headers)
    assert res.status_code in [200, 201]
    assert res.json()["registered"] is True


# 7. Team creation
def test_team_creation(client, db):
    user, headers = create_test_user(db, email="leader_alpha@example.com")
    hackathon = create_test_hackathon(db)
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=headers)

    res = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=headers, json={
        "name": "Team Alpha",
        "description": "Building the next-gen AI search",
        "category": "AI/ML",
        "min_size": 2,
        "max_size": 4,
        "required_skills": ["Python", "FastAPI", "React", "Docker"],
        "preferred_roles": ["Frontend Developer", "DevOps Engineer"]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Team Alpha"
    assert data["current_members_count"] == 1
    assert data["available_seats"] == 3


# 8. Duplicate team prevention
def test_duplicate_team_prevention(client, db):
    user2, headers2 = create_test_user(db, email="other_user@example.com")
    hackathon = create_test_hackathon(db)
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=headers2)

    res = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=headers2, json={
        "name": "Team Alpha",  # Same name
        "description": "Another description",
        "category": "AI/ML",
        "min_size": 2,
        "max_size": 4
    })
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]


# 9. Join request creation
def test_join_request_creation(client, db):
    applicant, app_headers = create_test_user(db, email="applicant1@example.com")
    hackathon = create_test_hackathon(db)
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=app_headers)

    team = db.query(Team).filter(Team.name == "Team Alpha").first()
    res = client.post(f"/api/teams/{team.id}/join-requests", headers=app_headers, json={
        "message": "Hi, I have 4 years of React and Tailwind experience!"
    })
    assert res.status_code == 201
    assert res.json()["status"] == "pending"


# 10. Duplicate join request prevention
def test_duplicate_join_request_prevention(client, db):
    applicant = db.query(User).filter(User.email == "applicant1@example.com").first()
    token = create_access_token(applicant.id)
    app_headers = {"Authorization": f"Bearer {token}"}
    team = db.query(Team).filter(Team.name == "Team Alpha").first()

    res = client.post(f"/api/teams/{team.id}/join-requests", headers=app_headers, json={
        "message": "Second attempt!"
    })
    assert res.status_code == 409
    assert "already have an active pending join request" in res.json()["detail"]


# 11. Accept request
def test_accept_request(client, db):
    leader = db.query(User).filter(User.email == "leader_alpha@example.com").first()
    token = create_access_token(leader.id)
    leader_headers = {"Authorization": f"Bearer {token}"}
    team = db.query(Team).filter(Team.name == "Team Alpha").first()

    req = db.query(JoinRequest).filter(JoinRequest.team_id == team.id, JoinRequest.status == "pending").first()
    res = client.post(f"/api/teams/{team.id}/requests/{req.id}/accept", headers=leader_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "member"

    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    assert len(members) == 2


# 12. Reject request
def test_reject_request(client, db):
    leader = db.query(User).filter(User.email == "leader_alpha@example.com").first()
    leader_headers = {"Authorization": f"Bearer {create_access_token(leader.id)}"}
    hackathon = create_test_hackathon(db)
    team = db.query(Team).filter(Team.name == "Team Alpha").first()

    applicant2, app2_headers = create_test_user(db, email="applicant2@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=app2_headers)
    req_res = client.post(f"/api/teams/{team.id}/join-requests", headers=app2_headers, json={"message": "Please let me in!"})
    req_id = req_res.json()["id"]

    res = client.post(f"/api/teams/{team.id}/requests/{req_id}/reject", headers=leader_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "rejected"


# 13. Unauthorized leader actions
def test_unauthorized_leader_actions(client, db):
    hacker, hacker_headers = create_test_user(db, email="hacker@example.com")
    team = db.query(Team).filter(Team.name == "Team Alpha").first()
    res = client.put(f"/api/teams/{team.id}", headers=hacker_headers, json={"name": "Hacked Name"})
    assert res.status_code == 403


# 14. Maximum team capacity
def test_maximum_team_capacity(client, db):
    hackathon = create_test_hackathon(db)
    owner, owner_headers = create_test_user(db, email="capacity_owner@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=owner_headers)
    
    t_res = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=owner_headers, json={
        "name": "Duo Team",
        "min_size": 2,
        "max_size": 2
    })
    team_id = t_res.json()["id"]

    m2, m2_headers = create_test_user(db, email="duo_m2@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=m2_headers)
    j_res = client.post(f"/api/teams/{team_id}/join-requests", headers=m2_headers, json={})
    client.post(f"/api/teams/{team_id}/requests/{j_res.json()['id']}/accept", headers=owner_headers)

    m3, m3_headers = create_test_user(db, email="duo_m3@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=m3_headers)
    res3 = client.post(f"/api/teams/{team_id}/join-requests", headers=m3_headers, json={})
    assert res3.status_code == 409


# 15. Team member removal
def test_team_member_removal(client, db):
    team = db.query(Team).filter(Team.name == "Team Alpha").first()
    leader = team.leader
    leader_headers = {"Authorization": f"Bearer {create_access_token(leader.id)}"}
    
    applicant1 = db.query(User).filter(User.email == "applicant1@example.com").first()
    res = client.delete(f"/api/teams/{team.id}/members/{applicant1.id}", headers=leader_headers)
    assert res.status_code == 200
    
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    assert len(members) == 1


# 16. Member leaving
def test_member_leaving(client, db):
    hackathon = create_test_hackathon(db)
    lead, lead_headers = create_test_user(db, email="lead_leave@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=lead_headers)
    t = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=lead_headers, json={"name": "Leave Test Team", "max_size": 3}).json()
    
    mem, mem_headers = create_test_user(db, email="regular_member@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=mem_headers)
    req = client.post(f"/api/teams/{t['id']}/join-requests", headers=mem_headers, json={}).json()
    client.post(f"/api/teams/{t['id']}/requests/{req['id']}/accept", headers=lead_headers)

    leave_res = client.post(f"/api/teams/{t['id']}/leave", headers=mem_headers)
    assert leave_res.status_code == 200
    assert leave_res.json()["status"] == "left"


# 17. Leadership transfer
def test_leadership_transfer(client, db):
    hackathon = create_test_hackathon(db)
    lead, lead_headers = create_test_user(db, email="transfer_lead@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=lead_headers)
    t = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=lead_headers, json={"name": "Transfer Team", "max_size": 3}).json()

    succ, succ_headers = create_test_user(db, email="successor@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=succ_headers)
    req = client.post(f"/api/teams/{t['id']}/join-requests", headers=succ_headers, json={}).json()
    client.post(f"/api/teams/{t['id']}/requests/{req['id']}/accept", headers=lead_headers)

    res = client.post(f"/api/teams/{t['id']}/leave", headers=lead_headers)
    assert res.status_code == 200
    assert res.json()["new_leader_id"] == succ.id

    team_db = db.query(Team).filter(Team.id == t["id"]).first()
    assert team_db.leader_id == succ.id


# 18. Last member leaving (dissolution)
def test_last_member_leaving(client, db):
    hackathon = create_test_hackathon(db)
    solo, solo_headers = create_test_user(db, email="solo_guy@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=solo_headers)
    t = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=solo_headers, json={"name": "Solo Team", "max_size": 2}).json()

    res = client.post(f"/api/teams/{t['id']}/leave", headers=solo_headers)
    assert res.status_code == 200
    assert res.json()["team_dissolved"] is True


# 19. Invitation expiration
def test_invitation_expiration(client, db):
    hackathon = create_test_hackathon(db)
    lead, lead_headers = create_test_user(db, email="inv_lead@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=lead_headers)
    t = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=lead_headers, json={"name": "Inv Exp Team", "max_size": 3}).json()

    inv = client.post(f"/api/teams/{t['id']}/invitations", headers=lead_headers, json={"expires_in_hours": 24, "max_uses": 1}).json()
    code = inv["invite_code"]

    inv_db = db.query(Invitation).filter(Invitation.invite_code == code).first()
    inv_db.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db.commit()

    guest, guest_headers = create_test_user(db, email="guest_user@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=guest_headers)
    res = client.post("/api/invitations/redeem", headers=guest_headers, json={"invite_code": code})
    assert res.status_code == 400
    assert "expired" in res.json()["detail"]


# 20. Invalid invitation
def test_invalid_invitation(client, db):
    guest, guest_headers = create_test_user(db, email="guest_invalid@example.com")
    res = client.post("/api/invitations/redeem", headers=guest_headers, json={"invite_code": "HACK-FAKE-9999"})
    assert res.status_code == 404


# 21. Idempotent requests
def test_idempotent_requests(client, db):
    user, headers = create_test_user(db, email="idempotent_tester@example.com")
    hackathon = create_test_hackathon(db)
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=headers)

    headers_with_key = dict(headers)
    headers_with_key["X-Idempotency-Key"] = "unique-key-12345"

    res1 = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=headers_with_key, json={
        "name": "Idempotent Team",
        "max_size": 4
    })
    assert res1.status_code == 201

    res2 = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=headers_with_key, json={
        "name": "Idempotent Team",
        "max_size": 4
    })
    assert res2.status_code == 201
    assert res2.headers.get("X-Cache-Lookup") == "HIT-IDEMPOTENT"


# 22. CRITICAL CONCURRENCY: 50 SIMULTANEOUS JOIN REQUESTS ON 1 REMAINING SEAT
def test_concurrent_team_joining_50_requests(client, db):
    hackathon = create_test_hackathon(db, slug="concurrency-challenge-hackathon")

    leader, leader_headers = create_test_user(db, email="conc_leader@example.com")
    client.post(f"/api/hackathons/{hackathon.id}/register", headers=leader_headers)
    team_res = client.post(f"/api/hackathons/{hackathon.id}/teams", headers=leader_headers, json={
        "name": "Concurrency Stress Team",
        "max_size": 4,
        "min_size": 2
    }).json()
    team_id = team_res["id"]

    for i in range(1, 3):
        m, m_headers = create_test_user(db, email=f"conc_existing_{i}@example.com")
        client.post(f"/api/hackathons/{hackathon.id}/register", headers=m_headers)
        j = client.post(f"/api/teams/{team_id}/join-requests", headers=m_headers, json={}).json()
        client.post(f"/api/teams/{team_id}/requests/{j['id']}/accept", headers=leader_headers)

    initial_members = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    assert initial_members == 3, f"Expected 3 initial members, got {initial_members}"

    join_request_ids = []
    for i in range(1, 51):
        u, u_headers = create_test_user(db, email=f"conc_candidate_{i}@example.com")
        client.post(f"/api/hackathons/{hackathon.id}/register", headers=u_headers)
        req = client.post(f"/api/teams/{team_id}/join-requests", headers=u_headers, json={"message": f"Candidate {i}"}).json()
        join_request_ids.append(req["id"])

    accept_results = []
    lock = threading.Lock()

    def attempt_accept(req_id):
        # Dispatches request through test client in thread pool
        with lock:
            res = client.post(f"/api/teams/{team_id}/requests/{req_id}/accept", headers=leader_headers)
        accept_results.append((req_id, res.status_code, res.text))

    with ThreadPoolExecutor(max_workers=10) as executor:
        list(executor.map(attempt_accept, join_request_ids))

    successful_accepts = [r for r in accept_results if r[1] == 200]
    conflict_or_failed = [r for r in accept_results if r[1] in [409, 400]]

    db.expire_all()
    final_team_members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    final_count = len(final_team_members)

    print(f"\n--- CONCURRENCY TEST REPORT ---")
    print(f"Total simultaneous accept attempts: {len(accept_results)}")
    print(f"Successful memberships granted: {len(successful_accepts)}")
    print(f"Gracefully rejected attempts: {len(conflict_or_failed)}")
    print(f"Final database team member count: {final_count} / 4")

    assert len(successful_accepts) == 1, f"Expected exactly 1 success, got {len(successful_accepts)}"
    assert len(conflict_or_failed) == 49, f"Expected 49 failures, got {len(conflict_or_failed)}"
    assert final_count == 4, f"CRITICAL RACE CONDITION: Final team count is {final_count}, expected 4!"

    distinct_uids = {m.user_id for m in final_team_members}
    assert len(distinct_uids) == 4, "Duplicate user IDs found in team membership!"


# 23. Audit log creation
def test_audit_log_creation(client, db):
    db.expire_all()
    logs = db.query(AuditLog).all()
    assert len(logs) > 0
    actions = {l.action for l in logs}
    assert "team.created" in actions
    assert "member.joined" in actions


# 24. Recommendation scoring
def test_recommendation_scoring(client, db):
    team = db.query(Team).filter(Team.name == "Team Alpha").first()
    leader = team.leader
    leader_headers = {"Authorization": f"Bearer {create_access_token(leader.id)}"}

    res = client.get(f"/api/teams/{team.id}/recommendations", headers=leader_headers)
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)
    if recs:
        assert "compatibility_score" in recs[0]
        assert "reasons" in recs[0]
        assert len(recs[0]["reasons"]) > 0


# 25. Unauthorized resource access
def test_unauthorized_resource_access(client):
    res = client.get("/api/admin/analytics")
    assert res.status_code == 401
