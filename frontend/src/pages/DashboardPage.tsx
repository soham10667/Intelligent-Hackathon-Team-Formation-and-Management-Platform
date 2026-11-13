import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Compass, Sparkles, CheckCircle2, Clock, PlusCircle, 
  ArrowRight, Key, AlertCircle, ShieldAlert, Award, FileText 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Hackathon, Team, JoinRequest, TeammateRecommendation } from '../types';
import { Modal } from '../components/Modal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
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

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      const member = await api.redeemInvitation(inviteCode.trim());
      setRedeemSuccess(`Successfully joined team! Redirecting...`);
      setTimeout(() => {
        setRedeemModalOpen(false);
        navigate(`/teams/${member.team_id}`);
      }, 1000);
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to redeem invitation code');
    }
  };

  const registeredHackathons = hackathons.filter((h) => h.is_registered);

  // Compute profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let score = 30; // base registered
    if (user.bio) score += 15;
    if (user.headline) score += 15;
    if (user.skills && user.skills.length >= 3) score += 20;
    if (user.github_url || user.linkedin_url) score += 20;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileCompletion();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome, {user?.full_name}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {user?.role === 'admin' ? 'Platform Admin' : 'Competitor'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {user?.headline || 'Setup your technical profile and find complementary teammates.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setRedeemModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-slate-50"
          >
            <Key className="w-4 h-4 text-slate-400" />
            <span>Redeem Invite Code</span>
          </button>
          <Link
            to="/discovery"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Teams</span>
          </Link>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between max-w-md">
            <span className="text-xs font-bold text-slate-800">Profile Completion</span>
            <span className="text-xs font-bold text-blue-700">{profileScore}%</span>
          </div>
          <div className="w-full max-w-md bg-white rounded-full h-2 overflow-hidden border border-slate-200">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${profileScore}%` }} 
            />
          </div>
        </div>
        {profileScore < 100 && (
          <Link
            to="/profile"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Complete Profile (+skills & bio)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid: Registered Hackathons & Active Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Registered Hackathons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-lg">Your Hackathons</h2>
            </div>
            <Link to="/hackathons" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Browse All
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border">Loading hackathons...</div>
          ) : registeredHackathons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <p className="text-sm font-semibold text-slate-700">You haven't registered for any hackathons yet.</p>
              <p className="text-xs text-slate-500">Register to start building teams and submitting projects.</p>
              <Link
                to="/hackathons"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {registeredHackathons.map((h) => (
                <div
                  key={h.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Registered
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{h.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{h.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>Max Team Size: {h.max_team_size}</span>
                      <span>•</span>
                      <span>Organizer: {h.organizer_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {h.user_team_id ? (
                      <Link
                        to={`/teams/${h.user_team_id}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs text-center hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        View My Team
                      </Link>
                    ) : (
                      <Link
                        to={`/hackathons/${h.id}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs text-center hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Create / Join Team
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Join Requests Submitted */}
          <div className="pt-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Pending Join Requests</span>
            </h2>

            {myRequests.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                You have no pending team requests.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">Team: {req.team_name || `Team #${req.team_id}`}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Note: "{req.message || 'No message provided'}"</p>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-semibold uppercase text-[10px] ${
                          req.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : req.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teammate Recommendations & Quick Actions */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Quick Navigation</h3>
            </div>
            
            <div className="space-y-2">
              <Link
                to="/discovery"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Team Discovery Board</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/teammates"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Find Teammates</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Manage Profile & Skills</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-3">
            <h4 className="font-bold text-sm">Have a Team Invite Code?</h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              If your team leader gave you an invitation token (e.g. HACK-XXXX-YYYY), enter it directly to join their team.
            </p>
            <button
              onClick={() => setRedeemModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm"
            >
              Enter Invitation Code
            </button>
          </div>

        </div>

      </div>

      {/* Redeem Modal */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        title="Redeem Team Invitation"
      >
        <form onSubmit={handleRedeem} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter the high-entropy invitation code provided by your team leader to atomically join the team.
          </p>

          {redeemError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{redeemError}</span>
            </div>
          )}

          {redeemSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{redeemSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Invitation Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. HACK-8K9N-W2X7"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono uppercase"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRedeemModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              Redeem Code
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
