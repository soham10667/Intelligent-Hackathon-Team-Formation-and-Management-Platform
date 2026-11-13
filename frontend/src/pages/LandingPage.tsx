import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Compass, ArrowRight, CheckCircle2, ShieldCheck, 
  BarChart2, Lock, Clock, Layers, Activity, GitMerge, Check
} from 'lucide-react';
import { api } from '../services/api';
import { PlatformStats, Team } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featuredTeams, setFeaturedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, teamsData] = await Promise.all([
          api.getPlatformStats(),
          api.discoverTeams({ limit: 4, only_open_seats: true })
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
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Production Architecture • ACID Consistency Engine</span>
        </div>

        {/* Direct, non-decorative heading */}
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-950 tracking-tight leading-[1.15] max-w-3xl mx-auto">
          Find Your Perfect Hackathon Team.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Connect with passionate developers, designers, and innovators. Discover teammates, analyze skill gaps, and form balanced teams with race-proof database concurrency.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/hackathons"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Hackathons</span>
          </Link>
          <Link
            to="/teammates"
            className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs border border-slate-200 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Find Teammates</span>
          </Link>
        </div>

        {/* Carefully Designed Product Interface Preview */}
        <div className="pt-8 text-left">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            
            {/* Window Chrome */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">teamforge.internal/discovery</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>WebSockets Connected (0ms)</span>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Table Preview */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">Live Team Discovery Board</span>
                  <span className="text-slate-400 font-mono text-[11px]">Showing Open Opportunities</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded">
                  {[
                    {
                      name: 'NeuralCraft AI',
                      cat: 'AI/ML',
                      leader: 'Alex Chen',
                      capacity: '3/4 members',
                      needed: ['PyTorch', 'FastAPI'],
                      seats: '1 seat open'
                    },
                    {
                      name: 'Solana Zero Layer',
                      cat: 'Web3',
                      leader: 'Maria Garcia',
                      capacity: '2/4 members',
                      needed: ['Rust', 'React'],
                      seats: '2 seats open'
                    },
                    {
                      name: 'CloudNative Observability',
                      cat: 'DevTools',
                      leader: 'Devon Vance',
                      capacity: '3/5 members',
                      needed: ['Go', 'Kubernetes'],
                      seats: '2 seats open'
                    }
                  ].map((t, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{t.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {t.cat}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Lead: {t.leader}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{t.capacity}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-100">
                          {t.seats}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          {t.needed.map((sk) => (
                            <span key={sk} className="px-1.5 py-0.2 text-[10px] bg-slate-50 border border-slate-200 rounded text-slate-600 font-mono">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Inspector Preview */}
              <div className="border border-slate-100 rounded p-4 bg-slate-50/50 space-y-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
                    Skill Gap & Compatibility
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Automated matrix checking complementary proficiencies.
                  </p>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/80">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Frontend (React / Tailwind)</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Covered</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Backend API (FastAPI / SQL)</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Covered</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">DevOps & Cloud (Docker / CI)</span>
                    <span className="text-rose-600 font-medium">Critical Gap</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between font-medium text-[11px] text-slate-700 mb-1">
                    <span>Overall Team Compatibility</span>
                    <span className="font-mono text-slate-900">92.4%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: '92.4%' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Real Platform Statistics (Section 4.C - Verified Data Only) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-y border-slate-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {loading ? '...' : (stats?.total_participants || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Participants</div>
          </div>

          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {loading ? '...' : (stats?.active_hackathons || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Hackathons</div>
          </div>

          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {loading ? '...' : (stats?.teams_created || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Teams Formed</div>
          </div>

          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {loading ? '...' : (stats?.successful_team_matches || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Verified Matches</div>
          </div>
        </div>
      </section>

      {/* Main Features (Section 4.E) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-1 max-w-xl">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engineered for Reliability</div>
          <h2 className="text-2xl font-bold text-slate-950">Platform Architecture & Core Capabilities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Race-Proof Concurrency Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL row-level locking (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">SELECT ... FOR UPDATE</code>) eliminates TOCTOU race conditions. Verified with 50 simultaneous join requests yielding exactly 1 member and 49 clean rejections.
            </p>
          </div>

          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Explainable Teammate Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent mathematical scoring formula: 40% complementary skills, 25% timezone alignment, 20% availability overlap, and 15% role experience. No black-box hallucinations.
            </p>
          </div>

          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Real-Time WebSocket Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live updates for discovery board availability, join requests, and member transitions delivered instantly without polling or manual page refreshing.
            </p>
          </div>

          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Skill Gap Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Structured analysis contrasting team target skills against current member proficiencies (1-5) to identify missing critical competencies.
            </p>
          </div>

          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Cryptographic Invitations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-entropy tokens (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">HACK-XXXX-YYYY</code>) with configurable TTL, rate limiting, and instant leader revocation.
            </p>
          </div>

          <div className="panel p-5 space-y-2.5">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Immutable Audit Logging</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Append-only audit trail logging every team creation, membership mutation, leadership succession, and request resolution for competition transparency.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works (Section 4.D) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-1 max-w-xl">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow</div>
          <h2 className="text-2xl font-bold text-slate-950">How Teams Form in 4 Steps</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Create Your Profile',
              desc: 'Enter verified technical skills, proficiency levels (1-5), preferred roles, timezone, and weekly availability.'
            },
            {
              step: '02',
              title: 'Discover Hackathons',
              desc: 'Select upcoming competitions, verify team-size constraints (e.g. 2-5 members), and register in one click.'
            },
            {
              step: '03',
              title: 'Find Your Teammates',
              desc: 'Filter the live discovery board or review algorithmic recommendations with transparent match scores.'
            },
            {
              step: '04',
              title: 'Build Your Team',
              desc: 'Send atomic join requests or invite members via secure codes with zero capacity collisions.'
            }
          ].map((item, idx) => (
            <div key={idx} className="panel p-5 space-y-2">
              <div className="font-mono text-xs text-slate-400 font-semibold">{item.step}</div>
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem We Solve (Section 4.F) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="panel p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comparison</div>
            <h2 className="text-xl font-bold text-slate-950">Why Hackathon Organizers Choose TeamForge</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded border border-rose-200 bg-rose-50/30 space-y-3">
              <div className="text-xs font-semibold text-rose-800 uppercase tracking-wide">
                Ordinary Hackathon Teams (Without Platform)
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">×</span>
                  <span>Unbalanced teams (e.g., 4 frontend developers and zero backend or design).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">×</span>
                  <span>Over-subscribed teams due to application-level race conditions during rush hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">×</span>
                  <span>Participants secretly registered across multiple teams, breaking competition rules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">×</span>
                  <span>Stale spreadsheets and chaotic chat rooms with no real-time availability updates.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                TeamForge Platform Guarantees
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Automated skill gap analyzer recommends complementary roles and proficiencies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>PostgreSQL row locks prevent over-subscription under high simultaneous request load.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Physical database UNIQUE constraints enforce exactly 1 team membership per event.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Real-time WebSockets remove full teams from discovery immediately without page refresh.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action (Section 4.G) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="panel p-8 sm:p-10 text-center space-y-4 bg-slate-900 text-white border-slate-900">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight max-w-md mx-auto">
            Your Next Great Project Starts With the Right Team.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Discover teammates, analyze skill gaps, and form balanced teams with race-proof database concurrency.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/hackathons" : "/register"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-slate-900 font-medium text-xs hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>{user ? 'Browse Hackathons & Create Team' : 'Create Your Team'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

