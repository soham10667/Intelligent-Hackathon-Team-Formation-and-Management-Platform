import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Sparkles, ShieldCheck, Zap, Compass, ArrowRight, 
  CheckCircle2, AlertCircle, BarChart3, Clock, Lock, Layers 
} from 'lucide-react';
import { api } from '../services/api';
import { PlatformStats, Team } from '../types';
import { TeamCard } from '../components/TeamCard';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featuredTeams, setFeaturedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, teamsData] = await Promise.all([
          api.getPlatformStats(),
          api.discoverTeams({ limit: 3, only_open_seats: true })
        ]);
        setStats(statsData);
        setFeaturedTeams(teamsData);
      } catch (err) {
        console.warn('Could not load landing stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-transparent -z-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>High-Concurrency Team Formation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Find Your Perfect <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hackathon Team.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Connect with passionate developers, designers and innovators. Discover teammates, build balanced teams and turn your ideas into successful projects.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/hackathons"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Hackathons</span>
            </Link>
            <Link
              to="/teammates"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Users className="w-4 h-4" />
              <span>Find Teammates</span>
            </Link>
          </div>

          {/* Hero Illustration / Dashboard Preview */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-slate-200 to-slate-100 shadow-2xl border border-slate-200">
              <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-inner p-6 sm:p-8 text-left space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400 font-mono pl-2">teamforge.io/discovery</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-Time WebSocket Sync Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                    <span className="text-xs font-semibold text-blue-700">Intelligent Matching</span>
                    <p className="text-xl font-bold text-slate-900">94.8% Synergy</p>
                    <p className="text-xs text-slate-500">Completes missing Backend & DevOps gaps</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                    <span className="text-xs font-semibold text-purple-700">Race-Proof Engine</span>
                    <p className="text-xl font-bold text-slate-900">0 Over-subscription</p>
                    <p className="text-xs text-slate-500">Atomic transactional row locks in PostgreSQL</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700">Skill Gap Analyzer</span>
                    <p className="text-xl font-bold text-slate-900">100% Transparent</p>
                    <p className="text-xs text-slate-500">Directly maps member proficiencies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Real Platform Statistics (Section 4.C) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Verified Platform Metrics</h2>
          <p className="text-2xl font-bold text-slate-900">Live Hackathon Activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.total_participants || 0).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Participants</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <Compass className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.active_hackathons || 0).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Hackathons</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.teams_created || 0).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Teams Created</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.successful_team_matches || 0).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Successful Matches</p>
          </div>
        </div>
      </section>

      {/* How It Works (Section 4.D) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Streamlined Process</h2>
          <p className="text-3xl font-bold text-slate-900">How TeamForge Works</p>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            From registration to project kickoff in four straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Create Your Profile',
              desc: 'List your technical skills, proficiency levels (1-5), preferred roles, and availability.',
              icon: Users,
            },
            {
              step: '02',
              title: 'Discover Hackathons',
              desc: 'Browse verified upcoming challenges, register with one click, and explore team requirements.',
              icon: Compass,
            },
            {
              step: '03',
              title: 'Find Your Teammates',
              desc: 'Use explainable compatibility matching to identify developers who complement your exact gaps.',
              icon: Sparkles,
            },
            {
              step: '04',
              title: 'Build Your Team',
              desc: 'Send requests or invite members via cryptographically secure codes with zero capacity collisions.',
              icon: ShieldCheck,
            },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative space-y-3 group hover:border-blue-200 transition-colors">
              <span className="text-3xl font-black text-slate-100 group-hover:text-blue-100 transition-colors">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Features (Section 4.E) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Engineering Excellence</h2>
          <p className="text-3xl font-bold text-slate-900">Built for Serious Hackathon Teams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Teammate Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent, weighted algorithm analyzing complementary skills (40%), timezones (25%), availability (20%), and role balance (15%). No black-box hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Skill Gap Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Visual matrix showing which team requirements are covered, underrepresented, or completely missing, with direct role recommendations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Real-Time WebSocket Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant live notifications and discovery board updates as teams are created, requests accepted, and seats filled—no page refreshes required.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Race-Proof Formation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL row-level locking ensures that 50 simultaneous join requests against 1 remaining seat yield exactly 1 member and 49 clean rejections.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cryptographic Invitations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-entropy invitation tokens with expiration bounds, single-use limits, rate limiting, and instant leader revocation capabilities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Immutable Audit History</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every creation, membership join, leave, leadership transition, and invite redemption is recorded permanently in a structured audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose This Platform (Section 4.F) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">The Modern Standard</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">Why Hackathons Choose TeamForge</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-red-50/40 border border-red-100 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Ordinary Hackathon Platforms</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                <li>Chaotic Discord channels & spreadsheet signups</li>
                <li>Teams with 4 frontend devs and zero backend engineers</li>
                <li>Over-subscribed teams due to race conditions during deadlines</li>
                <li>Participants secretly registered in multiple competing teams</li>
                <li>Stale listings for teams that are already full</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>TeamForge SaaS Platform</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside font-medium">
                <li>Structured discovery board with live seat and skill filters</li>
                <li>Intelligent recommendation engine matching complementary gaps</li>
                <li>Database row locks prevent over-subscription under heavy load</li>
                <li>Database constraints enforce exactly 1 active team per participant</li>
                <li>Instant WebSocket live sync removes full teams immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action (Section 4.G) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl mx-auto">
            Your Next Great Project Starts With the Right Team.
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-md mx-auto">
            Join thousands of developers, designers, and innovators forming championship-winning hackathon teams.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/hackathons" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all shadow-md"
            >
              <span>{user ? 'Browse Hackathons & Create Team' : 'Create Your Team Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
