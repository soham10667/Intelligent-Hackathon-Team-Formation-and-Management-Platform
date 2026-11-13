import React, { useEffect, useState } from 'react';
import { Search, Filter, Users, Github, Linkedin, Globe, Sparkles, MapPin, Clock } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const TeammatesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.searchUsers({
        q: search || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (err) {
      console.warn('Failed to load participants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Participant Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Teammates
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Search thousands of verified hackathon competitors by skill, domain specialization, and availability.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill (e.g. PyTorch, React), or university..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Roles</option>
            <option value="Full Stack">Full Stack Developer</option>
            <option value="Frontend">Frontend Developer</option>
            <option value="Backend">Backend Engineer</option>
            <option value="AI/ML">AI/ML Engineer</option>
            <option value="UI/UX">UI/UX Designer</option>
            <option value="DevOps">DevOps Engineer</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading participants...</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-700">No participants found matching your query.</p>
          <p className="text-xs text-slate-400">Try searching for broader skills or clearing the role filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-100 flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      u.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{u.full_name}</h3>
                    <p className="text-xs text-blue-600 font-medium">{u.preferred_role || 'Developer'}</p>
                    <p className="text-[11px] text-slate-400">{u.college_org || 'Independent'}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {u.bio || u.headline || 'Passionate builder eager to compete and create high-impact software.'}
                </p>

                {/* Working hours & timezone */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.country || 'Global'} ({u.timezone})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.availability_hours_per_week || 20}h/wk</span>
                  </span>
                </div>

                {/* Skills */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Skills:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {u.skills && u.skills.length > 0 ? (
                      u.skills.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          {s.skill_name} ({s.proficiency}/5)
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills listed yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {u.experience_level || 'Intermediate'}
                </span>

                <div className="flex items-center gap-2 text-slate-400">
                  {u.github_url && (
                    <a href={u.github_url} target="_blank" rel="noreferrer" className="hover:text-slate-800">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {u.linkedin_url && (
                    <a href={u.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {u.portfolio_url && (
                    <a href={u.portfolio_url} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
