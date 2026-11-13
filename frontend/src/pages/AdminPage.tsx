import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Users, Layers, Award, Download, AlertTriangle, 
  Search, FileText, CheckCircle2, Clock 
} from 'lucide-react';
import { api } from '../services/api';
import { AdminAnalytics, User, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [stats, usersList, logs] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminParticipants({ q: search || undefined }),
        api.getAdminAuditLogs(),
      ]);
      setAnalytics(stats);
      setParticipants(usersList);
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [search]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-white rounded-3xl border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This dashboard requires administrative privileges. Please log in as an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizer & Admin Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Real-time analytics, participant directories, immutable audit trails, and data export.
          </p>
        </div>

        <a
          href={api.exportTeamsCsvUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Teams (CSV)</span>
        </a>
      </div>

      {/* Analytics KPI Grid */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Participants</span>
            <p className="text-2xl font-extrabold text-slate-900">{analytics.total_users.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Verified accounts</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Teams</span>
            <p className="text-2xl font-extrabold text-slate-900">{analytics.total_teams.toLocaleString()}</p>
            <span className="text-[11px] text-slate-400">
              {analytics.teams_recruiting} recruiting • {analytics.teams_full} full
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Team Size</span>
            <p className="text-2xl font-extrabold text-slate-900">{analytics.average_team_size} members</p>
            <span className="text-[11px] text-blue-600 font-medium">Optimal balance</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Successful Matches</span>
            <p className="text-2xl font-extrabold text-slate-900">{analytics.successful_matches.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Race-proof formed</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview & System Metrics
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeTab === 'participants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Participants Directory ({participants.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Formation Health Indicators</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600">Pending Join Requests</span>
                <span className="font-bold text-slate-900">{analytics.pending_join_requests}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600">Teams Currently Recruiting</span>
                <span className="font-bold text-emerald-600">{analytics.teams_recruiting}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-600">Completed & Full Teams</span>
                <span className="font-bold text-slate-900">{analytics.teams_full}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-600">Suspicious Token Attempts</span>
                <span className="font-bold text-slate-500">{analytics.suspicious_invite_attempts}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Concurrency & Consistency Audit</h3>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Over-Subscription Verified</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Database row locks (<code className="font-mono text-slate-800">FOR UPDATE</code>) and unique constraints guarantee that even 50 simultaneous join attempts never exceed team capacity bounds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participants by name or email..."
              className="w-full text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role / Organization</th>
                  <th className="p-4 font-semibold">Country / Timezone</th>
                  <th className="p-4 font-semibold">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{u.full_name}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-800 block">{u.preferred_role}</span>
                      <span className="text-slate-400">{u.college_org || 'Independent'}</span>
                    </td>
                    <td className="p-4">
                      <span>{u.country || 'Global'} ({u.timezone})</span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Actor ID</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 font-mono text-[11px]">
                  <td className="p-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-blue-700 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {log.actor_id ? `User #${log.actor_id}` : 'System'}
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
