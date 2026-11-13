import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, Search, Filter, Sparkles, RefreshCw, 
  Users, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { Team } from '../types';
import { TeamCard } from '../components/TeamCard';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

export const DiscoveryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('');
  const [onlyOpenSeats, setOnlyOpenSeats] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // Request Join Modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [liveUpdateToast, setLiveUpdateToast] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await api.discoverTeams({
        q: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        skill: skillFilter || undefined,
        only_open_seats: onlyOpenSeats,
        sort_by: sortBy,
      });
      setTeams(data);
    } catch (err) {
      console.warn('Failed to load discovery teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();

    // ⚡ SUBSCRIBE TO LIVE WEBSOCKET BROADCASTS
    const unsubCreated = wsService.on('team_created', (msg: any) => {
      setLiveUpdateToast(`New team created: "${msg.team?.name}"`);
      setTeams((prev) => [msg.team, ...prev]);
    });

    const unsubUpdated = wsService.on('team_updated', (msg: any) => {
      const updated = msg.team;
      setTeams((prev) => {
        if (onlyOpenSeats && updated.available_seats <= 0) {
          return prev.filter((t) => t.id !== updated.id);
        }
        const exists = prev.some((t) => t.id === updated.id);
        if (exists) {
          return prev.map((t) => (t.id === updated.id ? updated : t));
        }
        return [updated, ...prev];
      });
      setLiveUpdateToast(`Team updated: "${updated?.name}" (${updated?.available_seats} seats remaining)`);
    });

    const unsubDissolved = wsService.on('team_dissolved', (msg: any) => {
      setTeams((prev) => prev.filter((t) => t.id !== msg.team_id));
      setLiveUpdateToast('A team was dissolved');
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDissolved();
    };
  }, [categoryFilter, onlyOpenSeats, sortBy]);

  // Auto-dismiss live toast after 4 seconds
  useEffect(() => {
    if (liveUpdateToast) {
      const t = setTimeout(() => setLiveUpdateToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [liveUpdateToast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setRequestSending(true);
    try {
      await api.createJoinRequest(selectedTeam.id, joinMessage);
      alert('Join request sent successfully!');
      setJoinModalOpen(false);
      setJoinMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    } finally {
      setRequestSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast for Real-Time WebSocket updates */}
      {liveUpdateToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{liveUpdateToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live WebSocket Synced Board</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Team Discovery Board
          </h1>
          <p className="text-sm text-slate-500">
            Connect with teams actively seeking members to complement their skillsets.
          </p>
        </div>

        <button
          onClick={fetchTeams}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Listings</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team name, project idea, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm"
            />
          </div>

          {/* Skill Filter */}
          <div className="w-full md:w-56">
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Required skill (e.g. React)..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Filter
          </button>
        </form>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 border-none focus:ring-0 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Web3">Web3</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="HealthTech">HealthTech</option>
                <option value="ClimateTech">ClimateTech</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 border-none focus:ring-0 cursor-pointer"
              >
                <option value="newest">Recently Created</option>
                <option value="seats">Most Open Seats</option>
                <option value="size">Team Size</option>
              </select>
            </div>
          </div>

          {/* Toggle: Only Open Seats */}
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={onlyOpenSeats}
              onChange={(e) => setOnlyOpenSeats(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Only teams with open seats</span>
          </label>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading discovery board...</div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-700">No teams found matching your filters.</p>
          <p className="text-xs text-slate-400">Try loosening your search terms or checking back in a few minutes.</p>
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
                setSelectedTeam(team);
                setJoinModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Join Request Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title={`Request to Join ${selectedTeam?.name}`}
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Send a join request to <span className="font-semibold text-slate-800">{selectedTeam?.leader?.full_name}</span>.
            Highlight the skills and experience you'll bring to this team.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Personal Note (Optional)</label>
            <textarea
              rows={4}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Hi! I have extensive experience with FastAPI, PyTorch and React. I'd love to collaborate on this project..."
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
              disabled={requestSending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {requestSending ? 'Sending...' : 'Send Join Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
