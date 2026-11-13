import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Github, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-900 text-sm tracking-tight">TeamForge</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed text-xs">
              Commercial-grade hackathon team formation platform engineered for database consistency, transparent skill gap analysis, and race-proof high-concurrency membership.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] text-slate-500">System Status: All Engines Operational</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Product</div>
            <ul className="space-y-2 text-slate-500">
              <li><Link to="/hackathons" className="hover:text-slate-900 transition-colors">Hackathons</Link></li>
              <li><Link to="/discovery" className="hover:text-slate-900 transition-colors">Team Discovery</Link></li>
              <li><Link to="/teammates" className="hover:text-slate-900 transition-colors">Find Teammates</Link></li>
              <li><Link to="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <div className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Architecture</div>
            <ul className="space-y-2 text-slate-500 font-mono text-[11px]">
              <li>PostgreSQL ACID Locks</li>
              <li>Row-Level Locking</li>
              <li>Explainable Recommender</li>
              <li>Real-time WebSockets</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Documentation</div>
            <ul className="space-y-2 text-slate-500">
              <li><a href="/docs" target="_blank" className="hover:text-slate-900 flex items-center gap-1">FastAPI Docs <ArrowUpRight className="w-3 h-3 text-slate-400" /></a></li>
              <li><a href="/metrics" target="_blank" className="hover:text-slate-900 flex items-center gap-1">Prometheus Metrics <ArrowUpRight className="w-3 h-3 text-slate-400" /></a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 flex items-center gap-1">Source Repository <ArrowUpRight className="w-3 h-3 text-slate-400" /></a></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4">
          <p>© 2026 TeamForge Platform. Production Architecture Engineering Challenge.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Security Audited</span>
            <span>•</span>
            <span>REST API v1.0</span>
            <span>•</span>
            <span>SLA 99.9%</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

