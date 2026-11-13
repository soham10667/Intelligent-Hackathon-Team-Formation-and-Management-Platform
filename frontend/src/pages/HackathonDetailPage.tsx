import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Compass, Calendar, Users, Award, ShieldCheck, PlusCircle, 
  ArrowRight, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Hackathon, Team } from '../types';
import { TeamCard } from '../components/TeamCard';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

export const HackathonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const hackathonId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Create team form state
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamCategory, setTeamCategory] = useState('General');
  const [teamSkills, setTeamSkills] = useState('');
  const [teamRoles, setTeamRoles] = useState('');
  const [teamMin, setTeamMin] = useState(2);
  const [teamMax, setTeamMax] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [hData, tData] = await Promise.all([
        api.getHackathon(hackathonId),
        api.getHackathonTeams(hackathonId)
      ]);
      setHackathon(hData);
      setTeams(tData);
      if (hData) {
        setTeamMin(hData.min_team_size);
        setTeamMax(hData.max_team_size);
      }
    } catch (err) {
      console.warn('Failed to load hackathon details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hackathonId]);

  const handleRegister = async () => {
    try {
      await api.registerHackathon(hackathonId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const newTeam = await api.createTeam(hackathonId, {
        name: teamName,
        description: teamDesc,
        category: teamCategory,
        min_size: teamMin,
        max_size: teamMax,
        required_skills: teamSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_roles: teamRoles.split(',').map((r) => r.trim()).filter(Boolean),
      });
      setCreateTeamModalOpen(false);
      navigate(`/teams/${newTeam.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team');
    }
  };

  const handleJoinRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      await api.createJoinRequest(selectedTeam.id, joinMessage);
      alert('Join request submitted successfully!');
      setJoinModalOpen(false);
      setJoinMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit join request');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading hackathon details...</div>;
  }

  if (!hackathon) {
    return <div className="py-20 text-center text-xs text-slate-400">Hackathon not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner & Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={hackathon.banner_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80"}
            alt={hackathon.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
              {hackathon.status}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Organized by {hackathon.organizer_name}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {hackathon.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl line-clamp-2 leading-relaxed">
            {hackathon.description}
          </p>
        </div>
      </div>

      {/* Meta Stats Row & Action Buttons */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Timeline</span>
            <span className="font-semibold text-slate-900 text-sm">
              {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
            </span>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Team Boundaries</span>
            <span className="font-semibold text-slate-900 text-sm">
              {hackathon.min_team_size} to {hackathon.max_team_size} members
            </span>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Registration Deadline</span>
            <span className="font-semibold text-slate-900 text-sm">
              {new Date(hackathon.registration_deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!user ? (
            <Link
              to="/login"
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In to Register
            </Link>
          ) : !hackathon.is_registered ? (
            <button
              onClick={handleRegister}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Register for Hackathon
            </button>
          ) : hackathon.user_team_id ? (
            <Link
              to={`/teams/${hackathon.user_team_id}`}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              Go to Your Team
            </Link>
          ) : (
            <button
              onClick={() => setCreateTeamModalOpen(true)}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create a Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules & Requirements */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Rules & Guidelines</span>
        </h2>
        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
          {hackathon.rules || "1. Projects must be built during the designated hackathon timeline.\n2. Respect team capacity limits.\n3. One active team per participant enforced."}
        </p>
      </div>

      {/* Teams In Hackathon */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Teams in this Hackathon</h2>
            <p className="text-xs text-slate-500">Discover teams currently recruiting members</p>
          </div>
          {hackathon.is_registered && !hackathon.user_team_id && (
            <button
              onClick={() => setCreateTeamModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-700">No teams created yet.</p>
            <p className="text-xs text-slate-400">Be the first to create a team for this hackathon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                onRequestJoin={(team) => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  if (!hackathon.is_registered) {
                    alert('You must register for this hackathon before joining a team.');
                    return;
                  }
                  setSelectedTeam(team);
                  setJoinModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        title="Create a New Hackathon Team"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Pioneers"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="What are you building? What kind of teammates are you looking for?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={teamCategory}
                onChange={(e) => setTeamCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {(hackathon.categories || ['General', 'AI/ML', 'Web3']).map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Maximum Team Size</label>
              <input
                type="number"
                min={hackathon.min_team_size}
                max={hackathon.max_team_size}
                value={teamMax}
                onChange={(e) => setTeamMax(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Required Skills (comma separated)</label>
            <input
              type="text"
              value={teamSkills}
              onChange={(e) => setTeamSkills(e.target.value)}
              placeholder="e.g. Python, FastAPI, React, PyTorch"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Preferred Roles (comma separated)</label>
            <input
              type="text"
              value={teamRoles}
              onChange={(e) => setTeamRoles(e.target.value)}
              placeholder="e.g. Backend Engineer, UI/UX Designer"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateTeamModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              Create Team & Become Leader
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Request Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title={`Request to Join ${selectedTeam?.name}`}
      >
        <form onSubmit={handleJoinRequestSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Send a join request to the team leader. Highlight your relevant skills and experience.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Introduction Note (Optional)</label>
            <textarea
              rows={4}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Hi! I have 3 years of React/TypeScript experience and would love to build the frontend..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              Send Request
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
