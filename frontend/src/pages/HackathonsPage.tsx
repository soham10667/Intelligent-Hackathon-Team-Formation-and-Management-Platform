import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Search, Filter, Calendar, Users, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
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
      // Refresh list to update registered state
      fetchHackathons();
    } catch (err: any) {
      alert(err.message || 'Failed to register for hackathon');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Active Hackathons</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Hackathons
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Discover prestigious hackathons, register to compete, build your dream team, and win awards.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hackathon title or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm"
          />
        </form>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Categories</option>
            <option value="AI/ML">AI & Machine Learning</option>
            <option value="Web3">Web3 & Crypto</option>
            <option value="Developer Tools">Developer Tools</option>
            <option value="HealthTech">HealthTech</option>
            <option value="ClimateTech">ClimateTech</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="ongoing">Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading hackathons...</div>
      ) : hackathons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-700">No hackathons match your search criteria.</p>
          <p className="text-xs text-slate-400">Try broadening your search or resetting category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Banner */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={h.banner_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"}
                    alt={h.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider shadow-sm ${
                        h.status === 'ongoing'
                          ? 'bg-emerald-500 text-white'
                          : h.status === 'upcoming'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      {h.organizer_name}
                    </span>
                    <Link to={`/hackathons/${h.id}`} className="block group-hover:text-blue-600 transition-colors">
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">{h.title}</h3>
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {h.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Team: {h.min_team_size} - {h.max_team_size} people</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(h.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {h.categories?.map((cat, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-50 text-slate-600 border border-slate-200">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <Link
                  to={`/hackathons/${h.id}`}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  View Details
                </Link>

                {user && (
                  h.is_registered ? (
                    <span className="flex-1 py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Registered</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRegister(h.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
                    >
                      Register Now
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
