import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Github, Heart, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900">TeamForge</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Find the Right People. Build Stronger Teams. A high-concurrency, intelligent team formation platform built for elite hackathon participants.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-slate-700 transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/hackathons" className="hover:text-blue-600 transition-colors">Explore Hackathons</Link></li>
              <li><Link to="/discovery" className="hover:text-blue-600 transition-colors">Team Discovery Board</Link></li>
              <li><Link to="/teammates" className="hover:text-blue-600 transition-colors">Intelligent Matching</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-600 transition-colors">Participant Dashboard</Link></li>
            </ul>
          </div>

          {/* Engineering */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">Engineering</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> ACID Row-Level Locks</li>
              <li className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Race-Proof 50-Request Tested</li>
              <li className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-blue-500" /> WebSockets Real-Time Sync</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-500" /> Idempotent Transactions</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors">Features & Architecture</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 TeamForge Platform. Built for the Senior Full-Stack Hiring Challenge.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for 10,000+ Hackathon Innovators
          </p>
        </div>
      </div>
    </footer>
  );
};
