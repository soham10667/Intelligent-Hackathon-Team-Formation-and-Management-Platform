import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Compass, CheckCircle2, Clock, 
  ArrowRight, Shield, Award, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Hackathon, Team, JoinRequest } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [hList, reqList] = await Promise.all([
          api.getHackathons(),
          api.getMyJoinRequests(),
        ]);
        setHackathons(hList);
        setMyRequests(reqList);
      } catch (err) {
        console.warn('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const registeredHackathons = hackathons.filter((h) => h.is_registered);
  const pendingRequestsCount = myRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Contextual Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-950 tracking-tight">
                  Welcome, {user?.full_name}
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.headline || `${user?.college_org} • ${user?.preferred_role || 'Developer'}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/discovery"
                className="px-3 py-1.5 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Discover Teams</span>
              </Link>
              <Link
                to="/hackathons"
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </div>

          {/* Metric Summary Bar (Structured, Non-Floating) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="panel p-3.5 space-y-0.5">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Registered Events</div>
              <div className="text-xl font-bold font-mono text-slate-900">{registeredHackathons.length}</div>
            </div>
            <div className="panel p-3.5 space-y-0.5">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Pending Requests</div>
              <div className="text-xl font-bold font-mono text-slate-900">{pendingRequestsCount}</div>
            </div>
            <div className="panel p-3.5 space-y-0.5">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Weekly Availability</div>
              <div className="text-xl font-bold font-mono text-slate-900">{user?.availability_hours_per_week || 20}h/wk</div>
            </div>
            <div className="panel p-3.5 space-y-0.5">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Timezone Offset</div>
              <div className="text-xl font-bold font-mono text-slate-900">{user?.timezone || 'UTC'}</div>
            </div>
          </div>

          {/* Structured Table: Your Hackathons & Team Status */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950 uppercase tracking-wider text-[11px]">
                Your Registered Hackathons
              </h2>
              <Link to="/hackathons" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all ({hackathons.length})
              </Link>
            </div>

            {loading ? (
              <div className="panel p-6 text-center text-xs text-slate-400">Loading events...</div>
            ) : registeredHackathons.length === 0 ? (
              <div className="panel p-6 text-center space-y-2">
                <p className="text-xs text-slate-600 font-medium">You have not registered for any hackathons yet.</p>
                <p className="text-xs text-slate-400">Register for an upcoming competition to create or join a team.</p>
                <div className="pt-2">
                  <Link
                    to="/hackathons"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    <span>Browse Hackathons</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="panel overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="table-header">Hackathon Event</th>
                      <th className="table-header">Category</th>
                      <th className="table-header">Team Limits</th>
                      <th className="table-header">Membership Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registeredHackathons.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="table-cell font-medium text-slate-900">
                          <Link to={`/hackathons/${h.id}`} className="hover:underline">
                            {h.title}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-normal">
                            By {h.organizer_name}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {h.categories?.[0] || 'General'}
                          </span>
                        </td>
                        <td className="table-cell font-mono text-xs text-slate-600">
                          {h.min_team_size} – {h.max_team_size} members
                        </td>
                        <td className="table-cell">
                          {h.user_team_id ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>In Team (#{h.user_team_id})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Seeking Team</span>
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          {h.user_team_id ? (
                            <Link
                              to={`/teams/${h.user_team_id}`}
                              className="px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-block"
                            >
                              Workspace →
                            </Link>
                          ) : (
                            <Link
                              to={`/hackathons/${h.id}`}
                              className="px-2.5 py-1 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-block"
                            >
                              Create / Join Team
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Structured Table: Outgoing Join Requests */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950 uppercase tracking-wider text-[11px]">
                Outgoing Join Requests
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {myRequests.length} total requests
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="panel p-5 text-center text-xs text-slate-400">
                You currently have no pending team join requests.
              </div>
            ) : (
              <div className="panel overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="table-header">Team Target</th>
                      <th className="table-header">Message / Note</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="table-cell font-medium text-slate-900">
                          <Link to={`/teams/${req.team_id}`} className="hover:underline flex items-center gap-1">
                            <span>{req.team_name || `Team #${req.team_id}`}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        </td>
                        <td className="table-cell text-xs text-slate-600 max-w-xs truncate">
                          {req.message || '—'}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              req.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : req.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <Link
                            to={`/teams/${req.team_id}`}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            View Team
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

    </div>
  );
};

