export interface UserSkill {
  id: number;
  skill_name: string;
  proficiency: number;
  category: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  college_org?: string;
  country?: string;
  timezone: string;
  role: 'participant' | 'organizer' | 'admin';
  avatar_url?: string;
  headline?: string;
  bio?: string;
  experience_level: string;
  preferred_role: string;
  availability_hours_per_week: number;
  preferred_working_hours: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  skills: UserSkill[];
  is_active: boolean;
  created_at: string;
}

export interface Hackathon {
  id: number;
  slug: string;
  title: string;
  description: string;
  organizer_name: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  min_team_size: number;
  max_team_size: number;
  required_skills: string[];
  categories: string[];
  rules?: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'ended';
  participants_count: number;
  teams_count: number;
  is_registered: boolean;
  user_team_id?: number;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'leader' | 'member';
  joined_at: string;
  user: User;
}

export interface Team {
  id: number;
  hackathon_id: number;
  name: string;
  description?: string;
  category: string;
  leader_id: number;
  min_size: number;
  max_size: number;
  required_skills: string[];
  preferred_roles: string[];
  is_visible: boolean;
  status: 'recruiting' | 'full' | 'archived' | 'dissolved';
  current_members_count: number;
  available_seats: number;
  skills_covered: string[];
  created_at: string;
  leader: User;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
  hackathon: Hackathon;
}

export interface JoinRequest {
  id: number;
  team_id: number;
  user_id: number;
  hackathon_id: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  created_at: string;
  responded_at?: string;
  user: User;
  team_name?: string;
}

export interface Invitation {
  id: number;
  team_id: number;
  hackathon_id: number;
  invite_code: string;
  created_by: number;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
}

export interface TeammateRecommendation {
  user: User;
  compatibility_score: number;
  score_breakdown: {
    skill_synergy: number;
    timezone_match: number;
    availability_match: number;
    role_fit: number;
  };
  reasons: string[];
  matching_skills: string[];
  missing_skills_covered: string[];
}

export interface SkillGapReport {
  team_id: number;
  team_name: string;
  required_skills: string[];
  covered_skills: Array<{
    skill_name: string;
    count: number;
    average_proficiency: number;
    category: string;
    status: 'covered' | 'partially_covered';
  }>;
  missing_skills: string[];
  underrepresented_skills: string[];
  recommended_roles: string[];
  team_skills_breakdown: Record<string, number>;
}

export interface TeamCompatibilityReport {
  team_id: number;
  overall_score: number;
  skill_diversity_score: number;
  role_coverage_score: number;
  timezone_overlap_score: number;
  availability_score: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  scoring_formula_explanation: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata_json: Record<string, any>;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  hackathon_id?: number;
  team_id?: number;
  action: string;
  target_user_id?: number;
  details: Record<string, any>;
  created_at: string;
}

export interface PlatformStats {
  total_participants: number;
  active_hackathons: number;
  teams_created: number;
  successful_team_matches: number;
}

export interface AdminAnalytics {
  total_users: number;
  total_hackathons: number;
  total_teams: number;
  average_team_size: number;
  teams_recruiting: number;
  teams_full: number;
  pending_join_requests: number;
  successful_matches: number;
  suspicious_invite_attempts: number;
}
