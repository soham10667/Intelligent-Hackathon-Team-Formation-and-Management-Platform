import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, Award, Sparkles, Key, Clock, 
  UserMinus, LogOut, CheckCircle2, AlertCircle, 
  BarChart3, Copy, Check, FileText, ChevronRight,
  Shield, Plus, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { 
  TeamDetail, JoinRequest, Invitation, SkillGapReport, 
  TeamCompatibilityReport, AuditLog, TeammateRecommendation 
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [skillGap, setSkillGap] = useState<SkillGapReport | null>(null);
  const [compatibility, setCompatibility] = useState<TeamCompatibilityReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [recommendations, setRecommendations] = useState<TeammateRecommendation[]>([]);
  
  const [activeTab, setActiveTab] = useState<'members' | 'gap' | 'compatibility' | 'recs' | 'audit' | 'requests'>('members');
  const [loading, setLoading] = useState(true);

  // Invitation creation modal
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [invMaxUses, setInvMaxUses] = useState(1);
  const [invHours, setInvHours] = useState(72);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isLeader = Boolean(user && team && team.leader_id === user.id);
  const isMember = Boolean(user && team && team.members.some((m) => m.user_id === user.id));

  const loadTeamData = async () => {
    try {
      const [tData, gapData, compData, logsData] = await Promise.all([
        api.getTeam(teamId),
        api.getSkillGap(teamId),
        api.getCompatibility(teamId),
        api.getTeamAuditLogs(teamId),
      ]);
      setTeam(tData);
      setSkillGap(gapData);
      setCompatibility(compData);
      setAuditLogs(logsData);

      if (user && tData.leader_id === user.id) {
        const [reqs, invs, recs] = await Promise.all([
          api.getTeamRequests(teamId),
          api.getTeamInvitations(teamId),
          api.getRecommendations(teamId, 6),
        ]);
        setRequests(reqs);
        setInvitations(invs);
        setRecommendations(recs);
      }
    } catch (err) {
      console.warn('Failed to load team details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();

    // Real-Time event listeners for team membership updates
    const unsubJoinReq = wsService.on('new_join_request', (msg: any) => {
      if (isLeader) {
        setRequests((prev) => [msg.request, ...prev]);
      }
    });

    const unsubTeamUpdate = wsService.on('team_updated', (msg: any) => {
      if (msg.team?.id === teamId) {
        loadTeamData();
      }
    });

    return () => {
      unsubJoinReq();
      unsubTeamUpdate();
    };
  }, [teamId, user?.id]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await api.acceptRequest(teamId, requestId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await api.rejectRequest(teamId, requestId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
    try {
      await api.removeMember(teamId, memberUserId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team? If you are the leader, leadership will be transferred to the earliest joined member.')) return;
    try {
      await api.leaveTeam(teamId);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to leave team');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvitation(teamId, { max_uses: invMaxUses, expires_in_hours: invHours });
      setInvModalOpen(false);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invitation');
    }
  };

  const handleRevokeInvitation = async (invId: number) => {
    try {
      await api.revokeInvitation(invId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Loading team workspace...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <p className="text-sm text-slate-600">Team not found or has been disbanded.</p>
        <Link to="/discover" className="btn btn-secondary text-xs">
          Return to Team Discovery
        </Link>
      </div>
    );
  }

  const fillPercent = Math.min(100, Math.round((team.members.length / team.max_size) * 100));

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Workspace Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Link to="/hackathons" className="hover:text-slate-900 transition-colors">
              Hackathons
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/hackathons/${team.hackathon_id}`} className="hover:text-slate-900 transition-colors truncate max-w-xs">
              {team.hackathon?.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium truncate">{team.name}</span>
          </nav>

          {/* Title & Metadata Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {team.name}
                </h1>
                
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {team.category}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    team.status === 'full'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${team.status === 'full' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                  {team.status === 'full' ? 'Roster Locked (Full)' : `${team.available_seats} seat${team.available_seats === 1 ? '' : 's'} available`}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {team.description || 'No formal team description provided yet.'}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isLeader && (
                <button
                  onClick={() => setInvModalOpen(true)}
                  className="btn btn-primary text-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  Generate Invite Code
                </button>
              )}

              {isMember && (
                <button
                  onClick={handleLeaveTeam}
                  className="btn btn-danger text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave Team
                </button>
              )}
            </div>
          </div>

          {/* Capacity Progress Strip */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span>
                Team Leader: <strong className="text-slate-900 font-semibold">{team.leader?.full_name}</strong>
              </span>
              <span>•</span>
              <span className="font-mono">
                Created {new Date(team.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-700 text-xs">
                Capacity: <strong>{team.members.length}</strong> / {team.max_size} members ({fillPercent}%)
              </span>
              <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${fillPercent >= 100 ? 'bg-slate-500' : 'bg-blue-600'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 -mb-px">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members Roster</span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                {team.members.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gap')}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'gap'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Skill Gap Analysis</span>
              {skillGap && skillGap.missing_skills.length > 0 && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                  {skillGap.missing_skills.length} missing
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('compatibility')}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'compatibility'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compatibility Synergy</span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                {compatibility?.overall_score || 0}%
              </span>
            </button>

            {isLeader && (
              <>
                <button
                  onClick={() => setActiveTab('recs')}
                  className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'recs'
                      ? 'border-slate-950 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Teammate Matches</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                    {recommendations.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'requests'
                      ? 'border-slate-950 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Join Requests</span>
                  {requests.filter((r) => r.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-600 text-white font-bold">
                      {requests.filter((r) => r.status === 'pending').length}
                    </span>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log</span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                {auditLogs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ==================== TAB 1: MEMBERS ROSTER ==================== */}
        {activeTab === 'members' && (
          <div className="space-y-8">
            <div className="panel overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Team Members Roster</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified participants currently allocated to this team.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {team.members.length} of {team.max_size} positions filled
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="table-header">
                      <th className="py-2.5 px-6 font-semibold">Member</th>
                      <th className="py-2.5 px-4 font-semibold">Role</th>
                      <th className="py-2.5 px-4 font-semibold">Timezone & Commitment</th>
                      <th className="py-2.5 px-4 font-semibold">Verified Skills</th>
                      {isLeader && <th className="py-2.5 px-6 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {team.members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                              {member.user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-slate-950 flex items-center gap-1.5">
                                {member.user?.full_name}
                                {member.user_id === user?.id && (
                                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 rounded">you</span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{member.user?.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                member.role === 'leader'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {member.role}
                            </span>
                            <div className="text-[11px] text-slate-600">
                              {member.user?.preferred_role || 'General Contributor'}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          <div>{member.user?.timezone || 'UTC'}</div>
                          <div className="text-slate-400 text-[10px]">
                            {member.user?.availability_hours_per_week || 20}h/week • {member.user?.preferred_working_hours || 'Flexible'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {member.user?.skills && member.user.skills.length > 0 ? (
                              member.user.skills.map((s) => (
                                <span
                                  key={s.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200"
                                >
                                  {s.skill_name} <span className="text-slate-400">({s.proficiency}/5)</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No skills listed</span>
                            )}
                          </div>
                        </td>

                        {isLeader && (
                          <td className="py-3 px-6 text-right">
                            {member.role !== 'leader' ? (
                              <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                title="Remove member from team"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Team Leader</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cryptographic Invitations Section for Leader */}
            {isLeader && (
              <div className="panel overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 flex items-center gap-2">
                      <Key className="w-4 h-4 text-slate-700" />
                      Cryptographic Team Invitation Codes
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct single-use or multi-use invitation tokens with cryptographic hashing.
                    </p>
                  </div>
                  <button
                    onClick={() => setInvModalOpen(true)}
                    className="btn btn-secondary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Code
                  </button>
                </div>

                {invitations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No active invitation codes. Click "New Code" to generate a shareable join key.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="table-header">
                          <th className="py-2 px-6 font-semibold">Invite Code</th>
                          <th className="py-2 px-4 font-semibold">Uses</th>
                          <th className="py-2 px-4 font-semibold">Expires</th>
                          <th className="py-2 px-4 font-semibold">Status</th>
                          <th className="py-2 px-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-6">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-all">
                                  {inv.invite_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(inv.invite_code)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-800 transition-colors"
                                  title="Copy invite code"
                                >
                                  {copiedCode === inv.invite_code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {inv.uses_count} / {inv.max_uses} used
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">
                              {new Date(inv.expires_at).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            </td>
                            <td className="py-2.5 px-6 text-right">
                              <button
                                onClick={() => handleRevokeInvitation(inv.id)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-sans hover:underline"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: SKILL GAP ANALYZER ==================== */}
        {activeTab === 'gap' && skillGap && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Covered Requirements Panel */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-950">Covered Skills</h3>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {skillGap.covered_skills.length} present
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Competencies currently possessed by team members along with average proficiency.
                </p>

                <div className="space-y-2 pt-1">
                  {skillGap.covered_skills.map((s, idx) => (
                    <div key={idx} className="p-3 rounded border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-950">{s.skill_name}</div>
                        <span className="text-[11px] text-slate-500">{s.count} member(s) verified</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-slate-800 text-[11px]">
                          {s.average_proficiency.toFixed(1)} / 5.0
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${(s.average_proficiency / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills Panel */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-slate-950">Skill Deficits</h3>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    {skillGap.missing_skills.length} deficit(s)
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Target skills specified by the hackathon category that are absent from the roster.
                </p>

                <div className="space-y-2 pt-1">
                  {skillGap.missing_skills.length === 0 ? (
                    <div className="p-4 rounded border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-800">
                      ✓ No missing required skills. The roster covers all target competencies.
                    </div>
                  ) : (
                    skillGap.missing_skills.map((s, idx) => (
                      <div key={idx} className="p-3 rounded border border-amber-200 bg-amber-50/30 flex items-center justify-between text-xs">
                        <span className="font-medium text-amber-950">{s}</span>
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recommended Recruitment Roles */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-950">Recommended Profiles</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Suggested candidate roles that will resolve your remaining skill deficits.
                </p>

                <div className="space-y-2 pt-1">
                  {skillGap.recommended_roles.map((r, idx) => (
                    <div key={idx} className="p-3 rounded border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-950">{r}</div>
                        <span className="text-[11px] text-slate-500">Recruitment priority</span>
                      </div>
                      <Link 
                        to={`/teammates?role=${encodeURIComponent(r)}`}
                        className="btn btn-secondary text-[11px] py-1 px-2"
                      >
                        Search
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 3: TEAM COMPATIBILITY ==================== */}
        {activeTab === 'compatibility' && compatibility && (
          <div className="space-y-6">
            <div className="panel p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Team Compatibility & Synergy Index</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Evaluated deterministically using profile data across skill distribution, timezone coordination, committed hours, and role coverage.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-blue-600 tracking-tight">
                    {compatibility.overall_score}%
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">
                    Overall Synergy Score
                  </span>
                </div>
              </div>

              {/* 4 Deterministic Component Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Skill Complementarity</span>
                    <span className="font-mono text-slate-400">40% weight</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-950">
                    {compatibility.skill_diversity_score}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${compatibility.skill_diversity_score}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Timezone Overlap</span>
                    <span className="font-mono text-slate-400">25% weight</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-950">
                    {compatibility.timezone_overlap_score}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-slate-800 h-full rounded-full" style={{ width: `${compatibility.timezone_overlap_score}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Availability Commitment</span>
                    <span className="font-mono text-slate-400">20% weight</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-950">
                    {compatibility.availability_score}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${compatibility.availability_score}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Role Diversity</span>
                    <span className="font-mono text-slate-400">15% weight</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-950">
                    {compatibility.role_coverage_score}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${compatibility.role_coverage_score}%` }} />
                  </div>
                </div>
              </div>

              {/* Strengths & Observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded border border-emerald-200/80 bg-emerald-50/20 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Team Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {compatibility.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    Areas for Optimization
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {compatibility.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Mathematical Formula Footnote */}
              <div className="p-3 rounded bg-slate-100 text-[11px] font-mono text-slate-600 border border-slate-200">
                Formula: {compatibility.scoring_formula_explanation}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: TEAMMATE RECOMMENDATIONS ==================== */}
        {activeTab === 'recs' && isLeader && (
          <div className="space-y-6">
            <div className="panel overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-950">Recommended Teammate Matches</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top candidates registered for this hackathon whose attributes cover your team's open skill requirements.
                </p>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No compatible unteamed candidates found at this time. Check back as new participants register.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                            {rec.user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 text-sm flex items-center gap-2">
                              {rec.user.full_name}
                              <span className="font-mono text-[10px] text-slate-500">({rec.user.timezone})</span>
                            </div>
                            <span className="text-xs text-slate-600">{rec.user.preferred_role}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {rec.compatibility_score}% Match
                          </span>
                        </div>

                        {/* Match Rationale */}
                        <div className="text-xs text-slate-600 space-y-0.5 pl-12">
                          {rec.reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <span className="text-blue-600">✓</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>

                        {/* Skills Badges */}
                        <div className="flex flex-wrap gap-1 pl-12 pt-1">
                          {rec.user.skills.map((s) => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {s.skill_name} ({s.proficiency}/5)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:self-center">
                        <Link
                          to={`/teammates`}
                          className="btn btn-secondary text-xs"
                        >
                          View Full Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: JOIN REQUESTS FOR LEADER ==================== */}
        {activeTab === 'requests' && isLeader && (
          <div className="space-y-6">
            <div className="panel overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Incoming Join Requests</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Participants requesting to join this team. Approvals are checked against maximum team capacity.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {requests.filter((r) => r.status === 'pending').length} pending request(s)
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No join requests currently waiting for review.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {requests.map((req) => (
                    <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-950 text-sm">{req.user?.full_name}</span>
                          <span className="text-xs text-slate-500">({req.user?.preferred_role})</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            • {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {req.message && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200/80 max-w-xl">
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {req.user?.skills?.map((s) => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {s.skill_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="btn btn-primary text-xs"
                            >
                              Accept Applicant
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="btn btn-secondary text-xs text-rose-600 hover:text-rose-700"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${
                              req.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: AUDIT LOG TIMELINE ==================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="panel overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-950">Immutable Team Audit Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Append-only record of all team events, membership transitions, and permissions changes.
                </p>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No recorded events yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 bg-white">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            {log.action}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre className="p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600 border border-slate-200 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Invitation Generation Modal */}
      <Modal
        isOpen={invModalOpen}
        onClose={() => setInvModalOpen(false)}
        title="Generate Cryptographic Invitation Code"
      >
        <form onSubmit={handleCreateInvitation} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Create a cryptographically hashed invitation code for direct team onboarding without requiring join request approvals.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Max Member Usages</label>
            <input
              type="number"
              min={1}
              max={team.available_seats || 1}
              value={invMaxUses}
              onChange={(e) => setInvMaxUses(Number(e.target.value))}
              className="input font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Expiration Window (Hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={invHours}
              onChange={(e) => setInvHours(Number(e.target.value))}
              className="input font-mono text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setInvModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs"
            >
              Generate Code
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
