import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Search, Calendar, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Hackathon } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const HackathonsPage: React.FC = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const data = await api.getHackathons({
        q: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setHackathons(data);
    } catch (err) {
      console.warn('Failed to load hackathons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHackathons();
  };

  const handleRegister = async (hackathonId: number) => {
    try {
      await api.registerHackathon(hackathonId);
      fetchHackathons();
    } catch (err: any) {
      alert(err.message || 'Failed to register for hackathon');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  Hackathon Registry
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {hackathons.length} competitions listed
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Browse verified hackathons, register your participation, form teams, and collaborate toward project submission.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="pt-2 flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by hackathon title, domain, or host..."
                className="input pl-9 text-xs"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input text-xs w-full md:w-44 bg-white"
              >
                <option value="All">All Categories</option>
                <option value="AI/ML">AI & Machine Learning</option>
                <option value="Web3">Web3 & Decentralized</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="HealthTech">HealthTech</option>
                <option value="ClimateTech">ClimateTech</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-xs w-full md:w-36 bg-white"
              >
                <option value="All">All Phases</option>
                <option value="ongoing">Active / Ongoing</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Concluded</option>
              </select>

              <button
                type="button"
                onClick={fetchHackathons}
                className="btn btn-primary text-xs whitespace-nowrap"
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hackathon Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Loading hackathon directory...
            </div>
          </div>
        ) : hackathons.length === 0 ? (
          <div className="panel p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No hackathons found matching the filter criteria.</p>
            <p className="text-xs text-slate-500">Try adjusting your category or status filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((h) => (
              <div
                key={h.id}
                className="panel overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Top Header Strip with Status */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide truncate max-w-[200px]">
                      {h.organizer_name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        h.status === 'ongoing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : h.status === 'upcoming'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'ongoing' ? 'bg-emerald-500' : h.status === 'upcoming' ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      {h.status}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <Link to={`/hackathons/${h.id}`} className="block group">
                      <h3 className="font-bold text-slate-950 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                        {h.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {h.description}
                    </p>

                    {/* Metadata Strip */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.min_team_size}–{h.max_team_size} members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Starts {new Date(h.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {h.categories?.map((cat, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center gap-2">
                  <Link
                    to={`/hackathons/${h.id}`}
                    className="btn btn-secondary text-xs flex-1 text-center justify-center"
                  >
                    View Details
                  </Link>

                  {user && (
                    h.is_registered ? (
                      <span className="flex-1 py-1.5 px-3 text-xs font-mono font-medium text-emerald-800 bg-emerald-50 rounded border border-emerald-200 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(h.id)}
                        className="btn btn-primary text-xs flex-1"
                      >
                        Register
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
