import { 
  User, Hackathon, Team, TeamDetail, TeamMember, JoinRequest, 
  Invitation, TeammateRecommendation, SkillGapReport, 
  TeamCompatibilityReport, NotificationItem, AuditLog, 
  PlatformStats, AdminAnalytics 
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  // Add idempotency key for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
    if (!headers['X-Idempotency-Key']) {
      headers['X-Idempotency-Key'] = `fe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (_) {
      if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
        errorDetail = 'Backend server is unreachable. Please ensure the backend is running on port 8000.';
      } else {
        errorDetail = res.statusText || errorDetail;
      }
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => request<{ access_token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ access_token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<User>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Users
  updateProfile: (data: any) => request<User>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getUser: (id: number) => request<User>(`/users/${id}`),
  searchUsers: (params?: { q?: string; role?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<User[]>(`/users${q ? `?${q}` : ''}`);
  },

  // Hackathons
  getHackathons: (params?: { q?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Hackathon[]>(`/hackathons${q ? `?${q}` : ''}`);
  },
  getHackathon: (id: number) => request<Hackathon>(`/hackathons/${id}`),
  registerHackathon: (id: number) => request<{ message: string; registered: boolean }>(`/hackathons/${id}/register`, { method: 'POST' }),

  // Teams
  createTeam: (hackathonId: number, data: any) => request<Team>(`/hackathons/${hackathonId}/teams`, { method: 'POST', body: JSON.stringify(data) }),
  getHackathonTeams: (hackathonId: number) => request<Team[]>(`/hackathons/${hackathonId}/teams`),
  discoverTeams: (params?: { 
    hackathon_id?: number; 
    q?: string; 
    category?: string; 
    skill?: string; 
    only_open_seats?: boolean; 
    sort_by?: string;
    limit?: number;
    offset?: number;
  }) => {
    const cleanParams: any = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
      });
    }
    const q = new URLSearchParams(cleanParams).toString();
    return request<Team[]>(`/teams/discovery${q ? `?${q}` : ''}`);
  },
  getTeam: (id: number) => request<TeamDetail>(`/teams/${id}`),
  updateTeam: (id: number, data: any) => request<Team>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  leaveTeam: (teamId: number) => request<any>(`/teams/${teamId}/leave`, { method: 'POST' }),
  removeMember: (teamId: number, userId: number) => request<any>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

  // Join Requests
  createJoinRequest: (teamId: number, message?: string) => request<JoinRequest>(`/teams/${teamId}/join-requests`, { method: 'POST', body: JSON.stringify({ message }) }),
  getTeamRequests: (teamId: number, status?: string) => request<JoinRequest[]>(`/teams/${teamId}/requests${status ? `?status_filter=${status}` : ''}`),
  getMyJoinRequests: () => request<JoinRequest[]>('/users/me/join-requests'),
  acceptRequest: (teamId: number, reqId: number) => request<TeamMember>(`/teams/${teamId}/requests/${reqId}/accept`, { method: 'POST' }),
  rejectRequest: (teamId: number, reqId: number) => request<JoinRequest>(`/teams/${teamId}/requests/${reqId}/reject`, { method: 'POST' }),

  // Invitations
  createInvitation: (teamId: number, data: { max_uses?: number; expires_in_hours?: number }) => request<Invitation>(`/teams/${teamId}/invitations`, { method: 'POST', body: JSON.stringify(data) }),
  getTeamInvitations: (teamId: number) => request<Invitation[]>(`/teams/${teamId}/invitations`),
  revokeInvitation: (invId: number) => request<any>(`/invitations/${invId}`, { method: 'DELETE' }),
  redeemInvitation: (code: string) => request<TeamMember>('/invitations/redeem', { method: 'POST', body: JSON.stringify({ invite_code: code }) }),

  // AI & Matching Features
  getRecommendations: (teamId: number, limit: number = 10) => request<TeammateRecommendation[]>(`/teams/${teamId}/recommendations?limit=${limit}`),
  getSkillGap: (teamId: number) => request<SkillGapReport>(`/teams/${teamId}/skill-gap`),
  getCompatibility: (teamId: number) => request<TeamCompatibilityReport>(`/teams/${teamId}/compatibility`),
  getTeamAuditLogs: (teamId: number) => request<AuditLog[]>(`/teams/${teamId}/audit-logs`),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Stats & Admin
  getPlatformStats: () => request<PlatformStats>('/stats/platform'),
  getAdminAnalytics: () => request<AdminAnalytics>('/admin/analytics'),
  getAdminParticipants: (params?: { q?: string }) => request<User[]>(`/admin/participants${params?.q ? `?q=${params.q}` : ''}`),
  getAdminAuditLogs: () => request<AuditLog[]>('/admin/audit-logs'),
  exportTeamsCsvUrl: `${API_BASE}/admin/export/teams`,
};
