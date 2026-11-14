import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, Search, Filter, RefreshCw, 
  Users, LayoutGrid, List, ArrowRight, Check
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  // Auto-dismiss live toast after 3.5 seconds
  useEffect(() => {
    if (liveUpdateToast) {
      const t = setTimeout(() => setLiveUpdateToast(null), 3500);
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

  const categories = ['All', 'AI/ML', 'Web3', 'Developer Tools', 'HealthTech', 'ClimateTech', 'General'];

  return (
    <div className="space-y-6">
      
      {/* Toast for Real-Time WebSocket updates */}
      {liveUpdateToast && (
        <div className="fixed bottom-5 right-5 z-50 px-3.5 py-2.5 rounded bg-slate-900 text-white text-xs font-mono shadow-md border border-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{liveUpdateToast}</span>
        </div>
      )}

      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">Team Discovery Marketplace</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live WebSocket</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover teams recruiting teammates for upcoming hackathon challenges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded p-0.5 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded text-xs ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              title="Dense Table View"
              aria-label="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchTeams}
            className="px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Practical Filter Bar */}
      <div className="panel p-3.5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name or project idea..."
              className="w-full pl-8 pr-3 py-1.5 rounded text-xs border border-slate-200 bg-white focus-ring"
            />
          </div>

          {/* Skill Filter */}
          <div className="w-full sm:w-52">
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Required skill (e.g. Python)..."
              className="w-full px-3 py-1.5 rounded text-xs border border-slate-200 bg-white focus-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-3.5 py-1.5 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            Filter
          </button>
        </form>

        {/* Secondary Category Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-medium text-slate-400 mr-1 uppercase tracking-wide">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 border-none focus:ring-0 cursor-pointer pr-1"
              >
                <option value="newest">Recently Created</option>
                <option value="seats">Most Open Seats</option>
                <option value="size">Team Size</option>
              </select>
            </div>

            {/* Open Seats Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyOpenSeats}
                onChange={(e) => setOnlyOpenSeats(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Open seats only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Teams Display */}
      {loading ? (
        <div className="panel p-12 text-center text-xs text-slate-400 font-mono">
          Querying discovery board...
        </div>
      ) : teams.length === 0 ? (
        <div className="panel p-10 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">No teams matched your current filters.</p>
          <p className="text-xs text-slate-400">Try adjusting your skill filter or category selection.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : (
        /* Dense Table View */
        <div className="panel overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Team Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Team Lead</th>
                <th className="table-header">Capacity</th>
                <th className="table-header">Target Skills Needed</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((t) => {
                const isFull = t.status === 'full' || t.available_seats <= 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell font-medium text-slate-900">
                      <Link to={`/teams/${t.id}`} className="hover:underline">
                        {t.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs font-normal">
                        {t.description || 'Dedicated hackathon team.'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {t.category || 'General'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-600">
                      {t.leader?.full_name || 'Leader'}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      <span className={isFull ? 'text-slate-400' : 'text-emerald-700 font-semibold'}>
                        {t.current_members_count}/{t.max_size} ({t.available_seats} open)
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.required_skills?.slice(0, 3).map((sk) => (
                          <span key={sk} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-50 border border-slate-200 text-slate-600">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/teams/${t.id}`}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 inline-block"
                        >
                          View
                        </Link>
                        {!isFull && (
                          <button
                            onClick={() => {
                              if (!user) {
                                navigate('/login');
                                return;
                              }
                              setSelectedTeam(t);
                              setJoinModalOpen(true);
                            }}
                            className="px-2 py-1 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Join Request Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title={`Request to Join: ${selectedTeam?.name}`}
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Send an atomic join request to <span className="font-semibold text-slate-800">{selectedTeam?.leader?.full_name}</span>.
            The team leader will review your profile and technical skill proficiencies.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Applicant Note (Optional)</label>
            <textarea
              rows={3}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Briefly state your relevant skills, role preferences, and availability..."
              className="w-full px-3 py-2 rounded text-xs border border-slate-200 focus-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestSending}
              className="px-3 py-1.5 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm disabled:opacity-50"
            >
              {requestSending ? 'Submitting...' : 'Send Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

