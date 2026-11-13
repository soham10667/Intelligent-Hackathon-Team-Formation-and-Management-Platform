import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Team } from '../types';

interface Props {
  team: Team;
  onRequestJoin?: (team: Team) => void;
  showJoinButton?: boolean;
}

export const TeamCard: React.FC<Props> = ({ team, onRequestJoin, showJoinButton = true }) => {
  const isFull = team.status === 'full' || team.available_seats <= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {team.category || 'General'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isFull
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {isFull ? 'Team Full' : `${team.available_seats} seat${team.available_seats === 1 ? '' : 's'} open`}
          </span>
        </div>

        {/* Team Title & Description */}
        <Link to={`/teams/${team.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-bold text-slate-900 text-base line-clamp-1">{team.name}</h3>
        </Link>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {team.description || 'Dedicated hackathon team seeking collaborative teammates.'}
        </p>

        {/* Leader Info & Capacity */}
        <div className="mt-4 flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
              {team.leader?.full_name?.charAt(0) || 'L'}
            </div>
            <span className="truncate max-w-[110px]">{team.leader?.full_name || 'Leader'}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {team.current_members_count} / {team.max_size} members
            </span>
          </div>
        </div>

        {/* Required Skills */}
        <div className="mt-3.5 space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Looking for:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team.required_skills && team.required_skills.length > 0 ? (
              team.required_skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Open to all skillsets</span>
            )}
            {team.required_skills && team.required_skills.length > 4 && (
              <span className="px-1.5 py-0.5 text-xs text-slate-400">
                +{team.required_skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/teams/${team.id}`}
          className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80"
        >
          View Team
        </Link>
        {showJoinButton && !isFull && onRequestJoin && (
          <button
            onClick={() => onRequestJoin(team)}
            className="flex-1 py-2 px-3 text-xs font-semibold text-center text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1"
          >
            <span>Request to Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
