import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, ShieldCheck, Plus, 
  CheckCircle2, ChevronRight, ArrowUpRight, Clock
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Loading hackathon specifications...
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <p className="text-sm text-slate-600">Hackathon not found.</p>
        <Link to="/hackathons" className="btn btn-secondary text-xs">
          Return to Hackathons Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      
      {/* Header Workspace */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Link to="/hackathons" className="hover:text-slate-900 transition-colors">
              Hackathons
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium truncate">{hackathon.title}</span>
          </nav>

          {/* Title & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {hackathon.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
                    hackathon.status === 'ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : hackathon.status === 'upcoming'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${hackathon.status === 'ongoing' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                  {hackathon.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Organized by {hackathon.organizer_name}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {hackathon.description}
              </p>
            </div>

            {/* Contextual Action Button */}
            <div className="flex items-center gap-2.5">
              {!user ? (
                <Link
                  to="/login"
                  className="btn btn-primary text-xs"
                >
                  Sign In to Participate
                </Link>
              ) : !hackathon.is_registered ? (
                <button
                  onClick={handleRegister}
                  className="btn btn-primary text-xs"
                >
                  Register for Competition
                </button>
              ) : hackathon.user_team_id ? (
                <Link
                  to={`/teams/${hackathon.user_team_id}`}
                  className="btn btn-secondary text-xs"
                >
                  Open Team Workspace
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={() => setCreateTeamModalOpen(true)}
                  className="btn btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Form a New Team
                </button>
              )}
            </div>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-0.5">
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">Competition Timeline</span>
              <div className="font-mono text-slate-800 font-medium">
                {new Date(hackathon.start_date).toLocaleDateString()} — {new Date(hackathon.end_date).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-0.5 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">Team Capacity Limits</span>
              <div className="font-mono text-slate-800 font-medium">
                {hackathon.min_team_size} min to {hackathon.max_team_size} max members
              </div>
            </div>

            <div className="space-y-0.5 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">Registration Deadline</span>
              <div className="font-mono text-slate-800 font-medium">
                {new Date(hackathon.registration_deadline).toLocaleDateString()}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Guidelines Panel */}
        <div className="panel p-5 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-950">Competition Rules & Eligibility</h2>
          </div>
          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
            {hackathon.rules || "1. All code and deliverables must be authored during the official competition window.\n2. Team limits are enforced at the database transaction level.\n3. Participants may belong to exactly one active team per competition."}
          </p>
        </div>

        {/* Teams in Competition */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Competing Teams Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Teams looking for members with open seats and skill requirements.
              </p>
            </div>
            {hackathon.is_registered && !hackathon.user_team_id && (
              <button
                onClick={() => setCreateTeamModalOpen(true)}
                className="btn btn-secondary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Team
              </button>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="panel p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">No teams formed yet for this competition.</p>
              <p className="text-xs text-slate-500">Register and create the first team to begin recruiting teammates.</p>
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

      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        title="Form a New Hackathon Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          {formError && (
            <div className="p-3 rounded text-xs bg-rose-50 border border-rose-200 text-rose-700">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Team Name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Distributed Consensus Forge"
              className="input text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Project Focus & Description</label>
            <textarea
              rows={3}
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="What problem are you tackling? What is your technical vision?"
              className="input text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Target Category</label>
              <select
                value={teamCategory}
                onChange={(e) => setTeamCategory(e.target.value)}
                className="input text-xs bg-white"
              >
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Web3 & Crypto">Web3 & Crypto</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="HealthTech">HealthTech</option>
                <option value="ClimateTech">ClimateTech</option>
                <option value="General">General / Open Track</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Max Team Size</label>
              <input
                type="number"
                min={hackathon.min_team_size}
                max={hackathon.max_team_size}
                value={teamMax}
                onChange={(e) => setTeamMax(Number(e.target.value))}
                className="input text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Required Skills (comma-separated)</label>
            <input
              type="text"
              value={teamSkills}
              onChange={(e) => setTeamSkills(e.target.value)}
              placeholder="e.g. PyTorch, React, PostgreSQL, Docker"
              className="input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Preferred Roles (comma-separated)</label>
            <input
              type="text"
              value={teamRoles}
              onChange={(e) => setTeamRoles(e.target.value)}
              placeholder="e.g. AI Engineer, Frontend Engineer, Designer"
              className="input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateTeamModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs"
            >
              Initialize Team
            </button>
          </div>
        </form>
      </Modal>

      {/* Request to Join Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title={`Request to Join: ${selectedTeam?.name || 'Team'}`}
      >
        <form onSubmit={handleJoinRequestSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Send an introductory note to <strong>{selectedTeam?.leader?.full_name || 'the team leader'}</strong> explaining your technical background and how your skills fulfill the team's needs.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Introductory Message</label>
            <textarea
              rows={4}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Hi, I noticed you need a backend engineer with FastAPI and PostgreSQL expertise. I have 3 years of production experience..."
              className="input text-xs resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
