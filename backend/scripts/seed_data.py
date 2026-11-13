import os
import sys
import random
import time
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.models.models import (
    User, UserSkill, Hackathon, HackathonParticipant,
    Team, TeamMember, JoinRequest, Invitation, AuditLog
)
from app.core.security import get_password_hash, generate_secure_invite_code

# Pre-hashed password for fast bulk insertion
DEFAULT_HASH = get_password_hash("Hackathon2026!")

FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Casey", "Avery",
               "Devin", "Elena", "Marcus", "Siddharth", "Priya", "Chen", "Wei", "Aisha", "Mateo", "Camila",
               "Liam", "Noah", "Emma", "Olivia", "Sophia", "Lucas", "Maya", "Rohan", "Ananya", "Hiroshi"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
              "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
              "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez"]
COLLEGES = ["Stanford University", "MIT", "UC Berkeley", "Carnegie Mellon", "IIT Bombay", "IIT Delhi",
            "ETH Zurich", "University of Toronto", "Oxford University", "Tsinghua University", "National University of Singapore"]
COUNTRIES = ["United States", "India", "Canada", "Germany", "United Kingdom", "Singapore", "Australia", "Japan", "Brazil", "France"]
TIMEZONES = ["UTC", "UTC+5:30", "UTC-5", "UTC-8", "UTC+1", "UTC+8", "UTC+9"]
ROLES = ["Full Stack Developer", "Frontend Developer", "Backend Engineer", "AI/ML Engineer", "UI/UX Designer", "DevOps Engineer", "Mobile Developer"]
EXPERIENCES = ["Beginner", "Intermediate", "Advanced", "Expert"]
WORKING_HOURS = ["Morning", "Afternoon", "Evening", "Night", "Flexible"]

SKILL_CATALOG = {
    "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vue.js", "HTML5", "CSS3"],
    "backend": ["Python", "FastAPI", "Node.js", "PostgreSQL", "Go", "Django", "GraphQL", "Redis"],
    "ml": ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "LangChain", "OpenAI API"],
    "devops": ["Docker", "Kubernetes", "AWS", "CI/CD", "GitHub Actions", "GCP", "Terraform"],
    "design": ["Figma", "UI/UX", "Wireframing", "Prototyping", "Design Systems"],
    "mobile": ["Flutter", "React Native", "Swift", "Kotlin"]
}

ALL_SKILL_NAMES = [s for sublist in SKILL_CATALOG.values() for s in sublist]

HACKATHON_DEFS = [
    {
        "slug": "global-ai-hackathon-2026",
        "title": "Global AI & Agentic Hackathon 2026",
        "description": "Build next-generation multi-agent systems and intelligent developer tools.",
        "organizer_name": "Google DeepMind & Antigravity",
        "banner_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        "categories": ["AI/ML", "Developer Tools", "Agentic Systems"],
        "required_skills": ["Python", "FastAPI", "PyTorch", "React", "Docker"],
        "min_team_size": 2,
        "max_team_size": 4,
        "status": "ongoing"
    },
    {
        "slug": "web3-defi-summit-2026",
        "title": "Decentralized Finance & Web3 Sprint",
        "description": "Construct high-throughput zero-knowledge decentralized financial protocols.",
        "organizer_name": "Ethereum Foundation Alliance",
        "banner_url": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80",
        "categories": ["Web3", "Cryptography", "FinTech"],
        "required_skills": ["TypeScript", "Next.js", "Go", "PostgreSQL"],
        "min_team_size": 2,
        "max_team_size": 4,
        "status": "ongoing"
    },
    {
        "slug": "climate-tech-challenge-2026",
        "title": "Global Climate Tech & Clean Energy Hack",
        "description": "Data-driven climate monitoring, grid load optimization and carbon accounting.",
        "organizer_name": "UN Climate & Clean Tech Ventures",
        "banner_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        "categories": ["ClimateTech", "Data Science", "IoT"],
        "required_skills": ["Python", "React", "Tailwind CSS", "Docker"],
        "min_team_size": 2,
        "max_team_size": 4,
        "status": "ongoing"
    },
    {
        "slug": "health-genomics-hack-2026",
        "title": "Precision Health & Bio-Informatics Summit",
        "description": "Accelerating drug discovery and genomic variant analysis with modern compute.",
        "organizer_name": "BioTech Innovators Hub",
        "banner_url": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80",
        "categories": ["HealthTech", "BioInformatics", "AI/ML"],
        "required_skills": ["Python", "PyTorch", "TypeScript", "PostgreSQL"],
        "min_team_size": 2,
        "max_team_size": 4,
        "status": "upcoming"
    }
]

def seed_database(num_participants=10000, num_teams=2000):
    start_time = time.time()
    db = SessionLocal()

    print(f"--- Starting Bulk Seed: {num_participants} Participants, {num_teams} Teams ---")
    Base.metadata.create_all(bind=engine)

    # 1. Seed Admin User
    admin_user = db.query(User).filter(User.email == "admin@hackathon.io").first()
    if not admin_user:
        admin_user = User(
            email="admin@hackathon.io",
            hashed_password=DEFAULT_HASH,
            full_name="Platform Administrator",
            college_org="Global Hackathons HQ",
            country="United States",
            timezone="UTC",
            role="admin",
            experience_level="Expert",
            preferred_role="Full Stack Developer",
            availability_hours_per_week=40,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("Created default admin: admin@hackathon.io (password: Hackathon2026!)")

    # 2. Seed Hackathons
    hackathon_objs = []
    for h_def in HACKATHON_DEFS:
        existing = db.query(Hackathon).filter(Hackathon.slug == h_def["slug"]).first()
        if not existing:
            h = Hackathon(
                slug=h_def["slug"],
                title=h_def["title"],
                description=h_def["description"],
                organizer_name=h_def["organizer_name"],
                banner_url=h_def["banner_url"],
                start_date=datetime.now(timezone.utc) + timedelta(days=2),
                end_date=datetime.now(timezone.utc) + timedelta(days=7),
                registration_deadline=datetime.now(timezone.utc) + timedelta(days=1),
                min_team_size=h_def["min_team_size"],
                max_team_size=h_def["max_team_size"],
                required_skills=h_def["required_skills"],
                categories=h_def["categories"],
                rules="1. All work must be created during the event.\n2. Respect team capacity limits.\n3. Be inclusive.",
                status=h_def["status"]
            )
            db.add(h)
            db.flush()
            hackathon_objs.append(h)
        else:
            hackathon_objs.append(existing)
    db.commit()
    print(f"Seeded {len(hackathon_objs)} hackathons.")

    # 3. Check existing user count
    existing_users_count = db.query(User).count()
    users_to_create = max(0, num_participants - existing_users_count)
    print(f"Existing users: {existing_users_count}. Creating {users_to_create} new participants...")

    batch_size = 2000
    user_id_start = existing_users_count + 1
    
    # Fast bulk insertion for users
    for b in range(0, users_to_create, batch_size):
        chunk_size = min(batch_size, users_to_create - b)
        user_mappings = []
        for i in range(chunk_size):
            idx = b + i + user_id_start
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            user_mappings.append({
                "email": f"hacker_{idx}_{random.randint(100, 999)}@hackathon.io",
                "hashed_password": DEFAULT_HASH,
                "full_name": f"{fn} {ln}",
                "college_org": random.choice(COLLEGES),
                "country": random.choice(COUNTRIES),
                "timezone": random.choice(TIMEZONES),
                "role": "participant",
                "headline": f"{random.choice(EXPERIENCES)} {random.choice(ROLES)}",
                "bio": f"Passionate builder and hackathon competitor. Looking to win!",
                "experience_level": random.choice(EXPERIENCES),
                "preferred_role": random.choice(ROLES),
                "availability_hours_per_week": random.choice([15, 20, 25, 30, 40]),
                "preferred_working_hours": random.choice(WORKING_HOURS),
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            })
        db.bulk_insert_mappings(User, user_mappings)
        db.commit()
        print(f"Inserted {b + chunk_size}/{users_to_create} users...")

    # Fetch users for team seeding
    all_users = db.query(User.id, User.timezone, User.preferred_role).filter(User.role == "participant").all()
    all_user_ids = [u[0] for u in all_users]
    print(f"Total available participants: {len(all_user_ids)}")

    # 4. Seed user skills
    existing_skills_count = db.query(UserSkill).count()
    if existing_skills_count < len(all_user_ids):
        print("Seeding skills for participants...")
        skill_mappings = []
        for uid in all_user_ids[existing_skills_count:existing_skills_count + 5000]:
            chosen_skills = random.sample(ALL_SKILL_NAMES, k=random.randint(2, 4))
            for sk in chosen_skills:
                cat = "general"
                for c, slist in SKILL_CATALOG.items():
                    if sk in slist:
                        cat = c
                        break
                skill_mappings.append({
                    "user_id": uid,
                    "skill_name": sk,
                    "proficiency": random.randint(2, 5),
                    "category": cat,
                    "created_at": datetime.now(timezone.utc)
                })
        if skill_mappings:
            db.bulk_insert_mappings(UserSkill, skill_mappings)
            db.commit()
            print(f"Inserted {len(skill_mappings)} user skills.")

    # 5. Seed Teams & Members
    existing_teams_count = db.query(Team).count()
    teams_to_create = max(0, num_teams - existing_teams_count)
    print(f"Existing teams: {existing_teams_count}. Seeding {teams_to_create} teams...")

    TEAM_ADJECTIVES = ["Quantum", "Cyber", "Neural", "Hyper", "Apex", "Binary", "Cosmic", "Silicon", "Alpha", "Omni", "Prism", "Echo"]
    TEAM_NOUNS = ["Innovators", "Hackers", "Builders", "Engineers", "Pioneers", "Collective", "Syndicate", "Lab", "Force", "Squad", "Architects"]

    # Assign users uniquely to hackathons and teams
    active_hackathon = hackathon_objs[0]  # Global AI Hackathon
    
    # Shuffle user IDs to guarantee no duplicate memberships
    available_pool = list(all_user_ids)
    random.shuffle(available_pool)

    # Register participants to hackathons first
    print("Registering users to hackathons...")
    reg_mappings = []
    registered_uids = set()
    for uid in available_pool[:min(len(available_pool), 8000)]:
        reg_mappings.append({
            "hackathon_id": active_hackathon.id,
            "user_id": uid,
            "role_in_hackathon": "participant",
            "registered_at": datetime.now(timezone.utc)
        })
        registered_uids.add(uid)
    
    # Bulk insert participations, ignoring duplicates
    db.bulk_insert_mappings(HackathonParticipant, reg_mappings)
    db.commit()
    print(f"Registered {len(reg_mappings)} participants to {active_hackathon.title}.")

    # Now create teams with 1 to 4 members
    pool_idx = 0
    pool_list = list(registered_uids)
    
    team_created_count = 0
    for t_idx in range(teams_to_create):
        if pool_idx + 4 >= len(pool_list):
            break
        
        # Determine team size: either 1, 2, 3, or 4
        team_size = random.choice([1, 2, 3, 4])
        assigned_members = pool_list[pool_idx: pool_idx + team_size]
        pool_idx += team_size
        
        leader_id = assigned_members[0]
        adj = random.choice(TEAM_ADJECTIVES)
        noun = random.choice(TEAM_NOUNS)
        name = f"{adj} {noun} #{existing_teams_count + t_idx + 1}"
        
        max_size = 4
        is_full = (team_size >= max_size)
        status = "full" if is_full else "recruiting"
        
        team_obj = Team(
            hackathon_id=active_hackathon.id,
            name=name,
            description=f"Building high-impact solutions for {active_hackathon.title}.",
            category=random.choice(active_hackathon.categories or ["AI/ML"]),
            leader_id=leader_id,
            min_size=2,
            max_size=max_size,
            required_skills=random.sample(ALL_SKILL_NAMES, k=3),
            preferred_roles=random.sample(ROLES, k=2),
            is_visible=True,
            status=status
        )
        db.add(team_obj)
        db.flush()

        # Add leader
        db.add(TeamMember(
            team_id=team_obj.id,
            user_id=leader_id,
            hackathon_id=active_hackathon.id,
            role="leader",
            joined_at=datetime.now(timezone.utc)
        ))

        # Add other members
        for mid in assigned_members[1:]:
            db.add(TeamMember(
                team_id=team_obj.id,
                user_id=mid,
                hackathon_id=active_hackathon.id,
                role="member",
                joined_at=datetime.now(timezone.utc)
            ))

        # Seed an invitation code for recruiting teams
        if not is_full:
            code = generate_secure_invite_code(prefix="HACK")
            db.add(Invitation(
                team_id=team_obj.id,
                hackathon_id=active_hackathon.id,
                invite_code=code,
                created_by=leader_id,
                max_uses=max_size - team_size,
                uses_count=0,
                expires_at=datetime.now(timezone.utc) + timedelta(days=3),
                is_revoked=False
            ))

        # Audit log
        db.add(AuditLog(
            actor_id=leader_id,
            hackathon_id=active_hackathon.id,
            team_id=team_obj.id,
            action="team.created",
            details={"team_name": name, "initial_members": team_size}
        ))

        team_created_count += 1
        if team_created_count % 250 == 0:
            db.commit()
            print(f"Created {team_created_count}/{teams_to_create} teams...")

    db.commit()
    elapsed = time.time() - start_time
    print(f"\n=== SEED COMPLETE ===")
    print(f"Total time elapsed: {elapsed:.2f} seconds")
    print(f"Total Participants: {db.query(User).count()}")
    print(f"Total Teams: {db.query(Team).count()}")
    print(f"Total Memberships: {db.query(TeamMember).count()}")
    print(f"Active Invitations: {db.query(Invitation).count()}")
    print(f"Audit Logs: {db.query(AuditLog).count()}")

if __name__ == "__main__":
    seed_database()

