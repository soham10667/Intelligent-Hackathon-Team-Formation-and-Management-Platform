from typing import List, Dict, Any, Set, Tuple
import math
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Team, User, TeamMember, UserSkill, HackathonParticipant
from app.schemas.schemas import (
    TeammateRecommendation, SkillGapReport, TeamCompatibilityReport, UserPublic
)

def parse_timezone_offset(tz_str: str) -> float:
    """
    Extracts numerical offset in hours from standard strings like 'UTC+5:30', 'UTC-4', 'America/New_York', etc.
    Defaults to 0.0 (UTC).
    """
    if not tz_str:
        return 0.0
    tz = tz_str.upper().strip()
    if tz == "UTC" or tz == "GMT":
        return 0.0
    if "+" in tz:
        try:
            parts = tz.split("+")[1].split(":")
            h = float(parts[0])
            m = float(parts[1]) if len(parts) > 1 else 0.0
            return h + (m / 60.0)
        except Exception:
            return 0.0
    if "-" in tz:
        try:
            parts = tz.split("-")[1].split(":")
            h = float(parts[0])
            m = float(parts[1]) if len(parts) > 1 else 0.0
            return -(h + (m / 60.0))
        except Exception:
            return 0.0
    # Common region mappings
    named_map = {
        "PST": -8.0, "PDT": -7.0, "EST": -5.0, "EDT": -4.0,
        "CST": -6.0, "CDT": -5.0, "IST": 5.5, "BST": 1.0,
        "CET": 1.0, "CEST": 2.0, "JST": 9.0, "AEST": 10.0
    }
    for k, v in named_map.items():
        if k in tz:
            return v
    return 0.0

def calculate_timezone_score(tz1: str, tz2: str) -> float:
    """
    Score 0.0 to 1.0 based on time difference.
    Same time zone = 1.0. 12+ hours difference = 0.0.
    """
    off1 = parse_timezone_offset(tz1)
    off2 = parse_timezone_offset(tz2)
    diff = abs(off1 - off2)
    if diff > 12:
        diff = 24 - diff
    score = max(0.0, 1.0 - (diff / 12.0))
    return score

def calculate_availability_score(user1: User, user2: User) -> float:
    """
    Compares preferred working hours and weekly commitments.
    """
    score = 0.5  # Base score
    # Working hours overlap
    h1 = (user1.preferred_working_hours or "Flexible").lower()
    h2 = (user2.preferred_working_hours or "Flexible").lower()
    if h1 == "flexible" or h2 == "flexible" or h1 == h2:
        score += 0.3
    
    # Weekly commit ratio similarity
    c1 = user1.availability_hours_per_week or 20
    c2 = user2.availability_hours_per_week or 20
    ratio = min(c1, c2) / max(c1, c2, 1)
    score += 0.2 * ratio
    return min(1.0, score)

def calculate_experience_role_score(candidate: User, team_roles_needed: List[str], existing_roles: List[str]) -> Tuple[float, List[str]]:
    """
    Scores how well the candidate fits the missing team roles.
    """
    score = 0.5
    reasons = []
    cand_role = candidate.preferred_role or "Full Stack Developer"
    
    # If candidate matches a needed role
    needed_match = any(cand_role.lower() in needed.lower() or needed.lower() in cand_role.lower() for needed in team_roles_needed)
    if needed_match:
        score += 0.3
        reasons.append(f"Directly satisfies your target recruiting role: {cand_role}")
    elif cand_role.lower() not in [r.lower() for r in existing_roles]:
        score += 0.2
        reasons.append(f"Brings diverse specialization ({cand_role}) to your team")
    
    # Experience level bonus
    exp = (candidate.experience_level or "Intermediate").lower()
    if exp in ["expert", "advanced"]:
        score += 0.2
        reasons.append(f"Brings strong {candidate.experience_level} execution experience")
    else:
        score += 0.1

    return min(1.0, score), reasons

class MatchingService:
    @staticmethod
    def get_skill_gap_report(db: Session, team: Team) -> SkillGapReport:
        team_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
        user_ids = [m.user_id for m in team_members]
        
        # Collect all skills in the team with counts and average proficiency
        team_skills: Dict[str, Dict[str, Any]] = {}
        for uid in user_ids:
            skills = db.query(UserSkill).filter(UserSkill.user_id == uid).all()
            for s in skills:
                name_key = s.skill_name.strip()
                if name_key not in team_skills:
                    team_skills[name_key] = {"count": 0, "total_prof": 0, "category": s.category}
                team_skills[name_key]["count"] += 1
                team_skills[name_key]["total_prof"] += s.proficiency

        required = [s.strip() for s in (team.required_skills or [])]
        covered_skills = []
        missing_skills = []
        underrepresented_skills = []
        
        team_skills_lower = {k.lower(): k for k in team_skills.keys()}

        for req in required:
            req_lower = req.lower()
            if req_lower in team_skills_lower:
                actual_name = team_skills_lower[req_lower]
                info = team_skills[actual_name]
                avg_prof = round(info["total_prof"] / info["count"], 1)
                covered_skills.append({
                    "skill_name": actual_name,
                    "count": info["count"],
                    "average_proficiency": avg_prof,
                    "category": info["category"],
                    "status": "covered" if info["count"] >= 1 and avg_prof >= 3.0 else "partially_covered"
                })
                if avg_prof < 3.0:
                    underrepresented_skills.append(actual_name)
            else:
                missing_skills.append(req)

        # Suggest roles based on missing skills
        recommended_roles = []
        missing_lower = [m.lower() for m in missing_skills]
        if any(x in missing_lower for x in ["react", "vue", "tailwind", "ui", "css", "html", "next.js", "frontend"]):
            recommended_roles.append("Frontend Developer")
        if any(x in missing_lower for x in ["python", "fastapi", "django", "node", "postgresql", "sql", "backend", "go", "java"]):
            recommended_roles.append("Backend Engineer")
        if any(x in missing_lower for x in ["pytorch", "tensorflow", "machine learning", "ai", "llm", "nlp", "computer vision"]):
            recommended_roles.append("AI/ML Engineer")
        if any(x in missing_lower for x in ["docker", "kubernetes", "aws", "ci/cd", "devops", "gcp"]):
            recommended_roles.append("DevOps Engineer")
        if any(x in missing_lower for x in ["figma", "ui/ux", "design", "product"]):
            recommended_roles.append("UI/UX Designer")

        if not recommended_roles and missing_skills:
            recommended_roles.append("Domain Specialist")

        return SkillGapReport(
            team_id=team.id,
            team_name=team.name,
            required_skills=required,
            covered_skills=covered_skills,
            missing_skills=missing_skills,
            underrepresented_skills=underrepresented_skills,
            recommended_roles=recommended_roles,
            team_skills_breakdown={k: v["count"] for k, v in team_skills.items()}
        )

    @staticmethod
    def get_team_compatibility(db: Session, team: Team) -> TeamCompatibilityReport:
        team_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
        if not team_members:
            return TeamCompatibilityReport(
                team_id=team.id,
                overall_score=0.0,
                skill_diversity_score=0.0,
                role_coverage_score=0.0,
                timezone_overlap_score=0.0,
                availability_score=0.0,
                strengths=["Empty team"],
                gaps=["No members yet"],
                suggestions=["Recruit members to calculate synergy"],
                scoring_formula_explanation="No members available"
            )

        users = [m.user for m in team_members]
        leader = team.leader

        # 1. Skill diversity score
        all_skills: Set[str] = set()
        for u in users:
            for s in u.skills:
                all_skills.add(s.skill_name.lower())
        req_skills = [s.lower() for s in (team.required_skills or [])]
        if req_skills:
            covered_reqs = sum(1 for r in req_skills if r in all_skills)
            skill_score = min(1.0, (covered_reqs / len(req_skills)) * 0.7 + (min(len(all_skills), 15) / 15.0) * 0.3)
        else:
            skill_score = min(1.0, len(all_skills) / 8.0)

        # 2. Role coverage score
        roles = [u.preferred_role or "Full Stack Developer" for u in users]
        distinct_roles = len(set(roles))
        role_score = min(1.0, distinct_roles / max(len(users), 1))

        # 3. Timezone overlap score
        tz_scores = []
        for i in range(len(users)):
            for j in range(i + 1, len(users)):
                tz_scores.append(calculate_timezone_score(users[i].timezone, users[j].timezone))
        tz_score = sum(tz_scores) / len(tz_scores) if tz_scores else 1.0

        # 4. Availability score
        commitments = [u.availability_hours_per_week or 20 for u in users]
        avg_commit = sum(commitments) / len(commitments)
        commit_variance = sum(abs(c - avg_commit) for c in commitments) / len(commitments)
        avail_score = max(0.5, 1.0 - (commit_variance / 40.0))

        # Overall weighted score
        w_skill = settings.WEIGHT_SKILLS
        w_tz = settings.WEIGHT_TIMEZONE
        w_avail = settings.WEIGHT_AVAILABILITY
        w_role = settings.WEIGHT_ROLE_EXPERIENCE
        
        overall = (skill_score * w_skill) + (tz_score * w_tz) + (avail_score * w_avail) + (role_score * w_role)
        overall_pct = round(overall * 100, 1)

        strengths = []
        gaps = []
        suggestions = []

        if skill_score >= 0.75:
            strengths.append(f"High technical coverage with {len(all_skills)} cumulative team skills")
        else:
            gaps.append("Core required skills still missing from active member profiles")
            suggestions.append("Recruit specialists matching unfulfilled required skills")

        if tz_score >= 0.8:
            strengths.append("Close timezone alignment facilitates frictionless synchronous pairing")
        elif tz_score < 0.6:
            gaps.append("Significant timezone dispersion across team members")
            suggestions.append("Establish asynchronous communication rituals and documented task handoffs")

        if distinct_roles >= min(len(users), 3):
            strengths.append(f"Balanced role distribution across {distinct_roles} distinct domains")
        else:
            gaps.append("Overlapping primary roles may lead to duplicated efforts")
            suggestions.append("Explicitly designate frontend, backend, or design ownership")

        explanation = (
            f"Overall score ({overall_pct}%) is computed deterministically from: "
            f"Skills Coverage ({round(skill_score * 100, 1)}% * {int(w_skill*100)}%), "
            f"Timezone Alignment ({round(tz_score * 100, 1)}% * {int(w_tz*100)}%), "
            f"Commitment Synergy ({round(avail_score * 100, 1)}% * {int(w_avail*100)}%), and "
            f"Role Diversity ({round(role_score * 100, 1)}% * {int(w_role*100)}%)."
        )

        return TeamCompatibilityReport(
            team_id=team.id,
            overall_score=overall_pct,
            skill_diversity_score=round(skill_score * 100, 1),
            role_coverage_score=round(role_score * 100, 1),
            timezone_overlap_score=round(tz_score * 100, 1),
            availability_score=round(avail_score * 100, 1),
            strengths=strengths,
            gaps=gaps,
            suggestions=suggestions,
            scoring_formula_explanation=explanation
        )

    @staticmethod
    def recommend_teammates_for_team(db: Session, team: Team, limit: int = 10) -> List[TeammateRecommendation]:
        """
        Recommends registered hackathon participants who:
        1. Are registered for this hackathon
        2. Are NOT already in any team for this hackathon
        3. Have complementary skills and high synergy
        """
        # Find all participants registered for this hackathon
        reg_records = db.query(HackathonParticipant).filter(
            HackathonParticipant.hackathon_id == team.hackathon_id
        ).all()
        candidate_user_ids = [r.user_id for r in reg_records]

        # Exclude users already in a team for this hackathon
        assigned_user_ids = {
            m.user_id for m in db.query(TeamMember.user_id).filter(
                TeamMember.hackathon_id == team.hackathon_id
            ).all()
        }
        eligible_user_ids = [uid for uid in candidate_user_ids if uid not in assigned_user_ids]

        if not eligible_user_ids:
            return []

        # Current team profile
        team_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
        existing_skills: Set[str] = set()
        existing_roles = [m.user.preferred_role for m in team_members if m.user.preferred_role]
        leader = team.leader

        for m in team_members:
            for s in m.user.skills:
                existing_skills.add(s.skill_name.lower())

        required_skills = [s.strip() for s in (team.required_skills or [])]
        missing_skills = [r for r in required_skills if r.lower() not in existing_skills]
        needed_roles = [r.strip() for r in (team.preferred_roles or [])]

        candidates = db.query(User).filter(User.id.in_(eligible_user_ids)).all()
        scored_candidates: List[TeammateRecommendation] = []

        w_skill = settings.WEIGHT_SKILLS
        w_tz = settings.WEIGHT_TIMEZONE
        w_avail = settings.WEIGHT_AVAILABILITY
        w_role = settings.WEIGHT_ROLE_EXPERIENCE

        for candidate in candidates:
            cand_skills_map = {s.skill_name.lower(): s.proficiency for s in candidate.skills}
            
            # 1. Skill synergy
            matched_missing = []
            cand_missing_score = 0.0
            for req in missing_skills:
                req_l = req.lower()
                if req_l in cand_skills_map:
                    matched_missing.append(req)
                    # proficiency 1-5 maps to 0.2 to 1.0
                    cand_missing_score += (cand_skills_map[req_l] / 5.0)
            
            if missing_skills:
                skill_score = cand_missing_score / len(missing_skills)
            else:
                # If team already covers all required, score on general skill breadth
                overlap_count = sum(1 for s in cand_skills_map if s in existing_skills)
                unique_count = len(cand_skills_map) - overlap_count
                skill_score = min(1.0, 0.4 + (unique_count * 0.1))

            # 2. Timezone compatibility (compared with team leader and average)
            tz_score = calculate_timezone_score(leader.timezone, candidate.timezone)

            # 3. Availability score
            avail_score = calculate_availability_score(leader, candidate)

            # 4. Role & experience score
            role_score, role_reasons = calculate_experience_role_score(candidate, needed_roles, existing_roles)

            # Weighted overall score
            total_score = (skill_score * w_skill) + (tz_score * w_tz) + (avail_score * w_avail) + (role_score * w_role)
            total_pct = round(total_score * 100, 1)

            # Generate explainable reasons
            reasons = []
            if matched_missing:
                reasons.append(f"Directly covers missing team skill(s): {', '.join(matched_missing)}")
            if tz_score >= 0.8:
                reasons.append(f"Excellent timezone alignment with your team ({candidate.timezone})")
            if avail_score >= 0.8:
                reasons.append(f"Strong commitment overlap ({candidate.availability_hours_per_week}h/week, {candidate.preferred_working_hours})")
            reasons.extend(role_reasons)
            if not reasons:
                reasons.append("Active hackathon participant with versatile engineering skillset")

            user_public = UserPublic.model_validate(candidate)

            scored_candidates.append(TeammateRecommendation(
                user=user_public,
                compatibility_score=total_pct,
                score_breakdown={
                    "skill_synergy": round(skill_score * 100, 1),
                    "timezone_match": round(tz_score * 100, 1),
                    "availability_match": round(avail_score * 100, 1),
                    "role_fit": round(role_score * 100, 1)
                },
                reasons=reasons,
                matching_skills=[s.skill_name for s in candidate.skills if s.skill_name.lower() in existing_skills],
                missing_skills_covered=matched_missing
            ))

        # Sort descending by compatibility score
        scored_candidates.sort(key=lambda x: x.compatibility_score, reverse=True)
        return scored_candidates[:limit]

