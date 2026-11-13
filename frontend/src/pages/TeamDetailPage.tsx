import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, Award, Sparkles, ShieldCheck, Key, Clock, 
  Trash2, UserMinus, LogOut, CheckCircle2, AlertCircle, 
  BarChart3, RefreshCw, Copy, Check, FileText 
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

  const isLeader = user && team && team.leader_id === user.id;
  const isMember = user && team && team.members.some((m) => m.user_id === user.id);

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

    // ⚡ Real-Time event listeners for team membership updates
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
    return <div className="py-20 text-center text-xs text-slate-400">Loading team details...</div>;
  }

  if (!team) {
    return <div className="py-20 text-center text-xs text-slate-400">Team not found or has been dissolved</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Team Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {team.category}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                team.status === 'full'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {team.status === 'full' ? 'Team Full' : `${team.available_seats} seat${team.available_seats === 1 ? '' : 's'} remaining`}
            </span>
            <span className="text-xs text-slate-400">
              Created {new Date(team.created_at).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {team.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {team.description || 'No description provided.'}
          </p>

          <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Competing in:</span>
            <Link to={`/hackathons/${team.hackathon_id}`} className="font-semibold text-blue-600 hover:text-blue-700">
              {team.hackathon?.title}
            </Link>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {isLeader && (
            <button
              onClick={() => setInvModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Key className="w-4 h-4" />
              <span>Generate Invite Code</span>
            </button>
          )}

          {isMember && (
            <button
              onClick={handleLeaveTeam}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('members')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members ({team.members.length}/{team.max_size})</span>
        </button>

        <button
          onClick={() => setActiveTab('gap')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'gap'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Skill Gap Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('compatibility')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'compatibility'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Team Compatibility ({compatibility?.overall_score || 0}%)</span>
        </button>

        {isLeader && (
          <>
            <button
              onClick={() => setActiveTab('recs')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'recs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Smart Teammate Recommendations</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Join Requests ({requests.filter((r) => r.status === 'pending').length})</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Activity Timeline ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-100 flex-shrink-0">
                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt={member.user.full_name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      member.user?.full_name?.charAt(0) || 'U'
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{member.user?.full_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === 'leader'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{member.user?.preferred_role || 'Developer'}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>{member.user?.timezone}</span>
                      <span>•</span>
                      <span>{member.user?.availability_hours_per_week || 20}h/wk</span>
                      <span>•</span>
                      <span>{member.user?.preferred_working_hours || 'Flexible'}</span>
                    </div>

                    {/* Member Skills */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {member.user?.skills?.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          {s.skill_name} ({s.proficiency}/5)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isLeader && member.role !== 'leader' && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Active Invitations List for Leader */}
          {isLeader && invitations.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Active Cryptographic Invitation Codes</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {inv.invite_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(inv.invite_code)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600"
                          title="Copy Code"
                        >
                          {copiedCode === inv.invite_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Uses: {inv.uses_count}/{inv.max_uses} • Expires: {new Date(inv.expires_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRevokeInvitation(inv.id)}
                      className="px-3 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SKILL GAP ANALYZER (INNOVATIVE FEATURE) */}
      {activeTab === 'gap' && skillGap && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Covered Skills */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Covered Requirements</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {skillGap.covered_skills.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Skills present among current team members.</p>
              
              <div className="space-y-2 pt-2">
                {skillGap.covered_skills.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{s.skill_name}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{s.count} member(s) covered</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      Avg: {s.average_proficiency}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Missing Skills</span>
                </h3>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  {skillGap.missing_skills.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Target skills your team currently lacks.</p>

              <div className="space-y-2 pt-2">
                {skillGap.missing_skills.length === 0 ? (
                  <p className="text-xs text-emerald-600 italic">No missing required skills!</p>
                ) : (
                  skillGap.missing_skills.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-red-50/50 border border-red-100 text-xs font-semibold text-rose-700">
                      {s}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Suggested Roles to Recruit */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Recommended Roles</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500">Specialists who would close your team's exact gaps.</p>

              <div className="space-y-2 pt-2">
                {skillGap.recommended_roles.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs font-semibold text-purple-700 flex items-center justify-between">
                    <span>{r}</span>
                    <span className="text-[10px] uppercase font-bold text-purple-500">Recruit</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: TEAM COMPATIBILITY REPORT (INNOVATIVE FEATURE) */}
      {activeTab === 'compatibility' && compatibility && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Overall Team Synergy Score</h2>
                <p className="text-xs text-slate-500">Mathematically computed from verified profile attributes.</p>
              </div>
              <div className="text-4xl font-black text-blue-600">
                {compatibility.overall_score}%
              </div>
            </div>

            {/* Metric Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600">Skill Diversity (40%)</span>
                <p className="text-2xl font-extrabold text-slate-900">{compatibility.skill_diversity_score}%</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${compatibility.skill_diversity_score}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600">Timezone Alignment (25%)</span>
                <p className="text-2xl font-extrabold text-slate-900">{compatibility.timezone_overlap_score}%</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${compatibility.timezone_overlap_score}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600">Availability Overlap (20%)</span>
                <p className="text-2xl font-extrabold text-slate-900">{compatibility.availability_score}%</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${compatibility.availability_score}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600">Role Diversity (15%)</span>
                <p className="text-2xl font-extrabold text-slate-900">{compatibility.role_coverage_score}%</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${compatibility.role_coverage_score}%` }} />
                </div>
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Team Strengths</h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {compatibility.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Improvement Opportunities</h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {compatibility.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
              {compatibility.scoring_formula_explanation}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SMART RECOMMENDATIONS */}
      {activeTab === 'recs' && isLeader && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">Recommended Teammates for Your Team</h3>
            <p className="text-xs text-slate-500">
              Participants registered for this hackathon whose skills, timezones, and roles best complement your existing roster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {rec.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{rec.user.full_name}</h4>
                      <p className="text-xs text-slate-500">{rec.user.preferred_role}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {rec.compatibility_score}% Synergy
                  </span>
                </div>

                {/* Reasons */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Why they match:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-600">
                    {rec.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1">
                  {rec.user.skills.map((s) => (
                    <span key={s.id} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: JOIN REQUESTS FOR LEADER */}
      {activeTab === 'requests' && isLeader && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">Manage Join Requests</h3>
            <p className="text-xs text-slate-500">Review applicants and accept them into your team.</p>
          </div>

          {requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border">
              No join requests received yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {requests.map((req) => (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{req.user?.full_name}</h4>
                      <span className="text-xs text-slate-400">({req.user?.preferred_role})</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{req.message || 'No note provided'}"</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {req.user?.skills?.map((s) => (
                        <span key={s.id} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {s.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-600">
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT LOG TIMELINE */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">Immutable Team Activity Timeline</h3>
            <p className="text-xs text-slate-500">Every membership transition and management action is permanently recorded.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pl-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {log.action}
                    </span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-1 p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600 font-mono overflow-x-auto border border-slate-100">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Invitation Modal */}
      <Modal
        isOpen={invModalOpen}
        onClose={() => setInvModalOpen(false)}
        title="Generate Cryptographic Invitation Code"
      >
        <form onSubmit={handleCreateInvitation} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate a secure random invite code (e.g. HACK-XXXX-YYYY). You can share this code with trusted teammates to let them join immediately.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Usage Limit (Seats)</label>
            <input
              type="number"
              min={1}
              max={team.available_seats || 1}
              value={invMaxUses}
              onChange={(e) => setInvMaxUses(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Expires in (Hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={invHours}
              onChange={(e) => setInvHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInvModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              Generate Code
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
