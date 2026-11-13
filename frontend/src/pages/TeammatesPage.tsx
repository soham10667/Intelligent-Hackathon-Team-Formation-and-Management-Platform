import React, { useEffect, useState } from 'react';
import { Search, Users, Github, Linkedin, Globe, MapPin, Clock, LayoutGrid, List, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const TeammatesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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
    <div className="min-h-screen bg-slate-50/60 pb-16">
      
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  Participant Directory
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {users.length} verified builders
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Discover unteamed competitors, review verified technical skills and proficiencies, and coordinate complementary team rosters.
              </p>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 self-start md:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-950 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dense table view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-950 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="pt-2 flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, skill (e.g. PyTorch, React, Go), or affiliation..."
                className="input pl-9 text-xs"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input text-xs w-full md:w-48 bg-white"
              >
                <option value="All">All Disciplines</option>
                <option value="Full Stack">Full Stack Developer</option>
                <option value="Frontend">Frontend Developer</option>
                <option value="Backend">Backend Engineer</option>
                <option value="AI/ML">AI/ML Engineer</option>
                <option value="UI/UX">UI/UX Designer</option>
                <option value="DevOps">DevOps Engineer</option>
              </select>

              <button
                type="button"
                onClick={fetchUsers}
                className="btn btn-primary text-xs whitespace-nowrap"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Loading participant records...
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="panel p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No participants found matching the query.</p>
            <p className="text-xs text-slate-500">Try widening your search terms or selecting "All Disciplines".</p>
          </div>
        ) : viewMode === 'table' ? (
          /* DENSE TABLE VIEW */
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="table-header">
                    <th className="py-2.5 px-6 font-semibold">Candidate</th>
                    <th className="py-2.5 px-4 font-semibold">Role & Experience</th>
                    <th className="py-2.5 px-4 font-semibold">Timezone & Hours</th>
                    <th className="py-2.5 px-4 font-semibold">Verified Skills</th>
                    <th className="py-2.5 px-6 font-semibold text-right">Profiles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                            {u.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 text-xs">
                              {u.full_name}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {u.college_org || 'Independent Builder'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{u.preferred_role || 'Developer'}</div>
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          {u.experience_level || 'Intermediate'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{u.country || 'Global'} ({u.timezone || 'UTC'})</div>
                        <div className="text-[10px] text-slate-400">
                          {u.availability_hours_per_week || 20}h/wk • {u.preferred_working_hours || 'Flexible'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.skills && u.skills.length > 0 ? (
                            u.skills.map((s) => (
                              <span
                                key={s.id}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200"
                              >
                                {s.skill_name} <span className="text-slate-400 font-normal">({s.proficiency}/5)</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No skills declared</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-6 text-right">
                        <div className="inline-flex items-center gap-2 text-slate-400">
                          {u.github_url && (
                            <a
                              href={u.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-slate-900 transition-colors"
                              title="GitHub Profile"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {u.linkedin_url && (
                            <a
                              href={u.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-blue-600 transition-colors"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {u.portfolio_url && (
                            <a
                              href={u.portfolio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-slate-900 transition-colors"
                              title="Portfolio"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="panel p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-950 text-xs">{u.full_name}</h3>
                        <p className="text-[11px] text-blue-700 font-medium">{u.preferred_role || 'Developer'}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {u.experience_level || 'Mid'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {u.bio || u.headline || 'Passionate builder eager to compete and create high-impact software.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{u.country || 'Global'} ({u.timezone})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{u.availability_hours_per_week || 20}h/wk</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {u.skills && u.skills.length > 0 ? (
                      u.skills.map((s) => (
                        <span
                          key={s.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          {s.skill_name} ({s.proficiency}/5)
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No skills listed</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {u.college_org || 'Independent'}
                  </span>

                  <div className="flex items-center gap-2 text-slate-400">
                    {u.github_url && (
                      <a href={u.github_url} target="_blank" rel="noreferrer" className="hover:text-slate-800">
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {u.linkedin_url && (
                      <a href={u.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {u.portfolio_url && (
                      <a href={u.portfolio_url} target="_blank" rel="noreferrer" className="hover:text-slate-800">
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
