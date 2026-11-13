import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Team } from '../types';

interface Props {
  team: Team;
  onRequestJoin?: (team: Team) => void;
  showJoinButton?: boolean;
}

export const TeamCard: React.FC<Props> = ({ team, onRequestJoin, showJoinButton = true }) => {
  const isFull = team.status === 'full' || team.available_seats <= 0;

  return (
    <div className="bg-white rounded border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {team.category || 'General'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
              isFull
                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isFull ? 'Team Full' : `${team.available_seats} seat${team.available_seats === 1 ? '' : 's'} available`}
          </span>
        </div>

        {/* Team Title & Description */}
        <Link to={`/teams/${team.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight line-clamp-1">{team.name}</h3>
        </Link>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {team.description || 'Hackathon team recruiting collaborative teammates.'}
        </p>

        {/* Leader Info & Capacity */}
        <div className="mt-3.5 flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-slate-800 text-white font-medium flex items-center justify-center text-[10px]">
              {team.leader?.full_name?.charAt(0) || 'L'}
            </div>
            <span className="truncate max-w-[120px] text-slate-700 font-medium">{team.leader?.full_name || 'Leader'}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {team.current_members_count}/{team.max_size}
            </span>
          </div>
        </div>

        {/* Required Skills */}
        <div className="mt-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Target Skills
          </div>
          <div className="flex flex-wrap gap-1">
            {team.required_skills && team.required_skills.length > 0 ? (
              team.required_skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Open to all skillsets</span>
            )}
            {team.required_skills && team.required_skills.length > 4 && (
              <span className="px-1 py-0.5 text-[10px] text-slate-400 font-mono">
                +{team.required_skills.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/teams/${team.id}`}
          className="flex-1 py-1.5 px-3 text-xs font-medium text-center text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-200"
        >
          View Team
        </Link>
        {showJoinButton && !isFull && onRequestJoin && (
          <button
            onClick={() => onRequestJoin(team)}
            className="flex-1 py-1.5 px-3 text-xs font-medium text-center text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
          >
            <span>Request to Join</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

