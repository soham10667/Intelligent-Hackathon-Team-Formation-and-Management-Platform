import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layers, Compass, Award, Users, UserCheck, Shield, 
  Key, Check, Menu, X, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Modal } from './Modal';

export const AuthenticatedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Redeem Code Modal State
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // If session is still loading
  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Loading workspace...
        </div>
      </div>
    );
  }

  // If guest visitor (not authenticated), render content directly without sidebar
  if (!user) {
    return <Outlet />;
  }

  // Compute profile completion percentage
  const calculateProfileCompletion = () => {
    let score = 30; // base registered
    if (user.bio) score += 15;
    if (user.headline) score += 15;
    if (user.skills && user.skills.length >= 3) score += 20;
    if (user.github_url || user.linkedin_url) score += 20;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileCompletion();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Layers },
    { name: 'Discover Teams', path: '/discovery', icon: Compass },
    { name: 'Hackathons', path: '/hackathons', icon: Award },
    { name: 'Find Teammates', path: '/teammates', icon: Users },
    { name: 'My Profile & Skills', path: '/profile', icon: UserCheck },
    ...(user.role === 'admin'
      ? [{ name: 'Admin Console', path: '/admin', icon: Shield }]
      : []),
  ];

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);
    setRedeemLoading(true);
    try {
      const member = await api.redeemInvitation(inviteCode.trim().toUpperCase());
      setRedeemSuccess('Successfully joined team! Redirecting to team workspace...');
      setTimeout(() => {
        setRedeemModalOpen(false);
        setInviteCode('');
        setRedeemSuccess(null);
        navigate(`/teams/${member.team_id}`);
      }, 1000);
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to redeem invitation code');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Reusable Sidebar Content Component
  const SidebarContent = () => (
    <div className="space-y-4">
      {/* 1. Main Navigation Panel */}
      <div className="panel p-3 space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const active = isItemActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                active
                  ? 'text-slate-950 bg-slate-100 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* 2. Profile Completion Checklist Panel */}
      <div className="panel p-3.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">Profile Status</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700">{profileScore}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-slate-900 h-full rounded-full transition-all duration-300" 
            style={{ width: `${profileScore}%` }} 
          />
        </div>
        <div className="space-y-1 text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Check className={`w-3 h-3 ${user?.skills && user.skills.length >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>3+ Technical Skills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className={`w-3 h-3 ${user?.bio ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>Bio & Headline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className={`w-3 h-3 ${user?.github_url || user?.linkedin_url ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>Social / Portfolio URL</span>
          </div>
        </div>
        {profileScore < 100 && (
          <Link
            to="/profile"
            onClick={() => setMobileDrawerOpen(false)}
            className="block text-[11px] font-medium text-blue-600 hover:text-blue-800 pt-1"
          >
            Update Profile →
          </Link>
        )}
      </div>

      {/* 3. Quick Action: Redeem Invite Code */}
      <div className="panel p-3.5 space-y-2 text-xs">
        <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">Have an Invite?</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Enter a token (e.g. HACK-XXXX-YYYY) to join a team instantly.
        </p>
        <button
          onClick={() => {
            setMobileDrawerOpen(false);
            setRedeemModalOpen(true);
          }}
          className="w-full py-1.5 px-2.5 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>Redeem Code</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Mobile Hamburger Workspace Toggle (Visible on md:hidden) */}
        <div className="md:hidden mb-4 flex items-center justify-between panel p-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold text-slate-900">Workspace Menu</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Open Menu</span>
          </button>
        </div>

        {/* Mobile Slide-Out Drawer Overlay */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/60 transition-opacity" 
              onClick={() => setMobileDrawerOpen(false)} 
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full p-4 overflow-y-auto space-y-4 border-r border-slate-200 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                    TF
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">Workspace</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <SidebarContent />
            </div>
          </div>
        )}

        {/* Primary Desktop & Tablet Container */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Permanent Desktop Left Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0 sticky top-20">
            <SidebarContent />
          </aside>

          {/* Main Content Pane (Automatically adjusts to sidebar) */}
          <main className="flex-1 min-w-0 w-full">
            <Outlet />
          </main>
        </div>

      </div>

      {/* Global Persistent Redeem Invite Code Modal */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={() => {
          setRedeemModalOpen(false);
          setRedeemError(null);
          setRedeemSuccess(null);
        }}
        title="Redeem Cryptographic Invitation Code"
      >
        <form onSubmit={handleRedeem} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter the invitation token provided by a team leader (e.g. <span className="font-mono font-semibold text-slate-800">HACK-XXXX-YYYY</span>). This will join you directly to the team.
          </p>

          {redeemError && (
            <div className="p-3 rounded text-xs bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{redeemError}</span>
            </div>
          )}

          {redeemSuccess && (
            <div className="p-3 rounded text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{redeemSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Invitation Token</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="HACK-XXXX-YYYY"
              className="input font-mono uppercase tracking-wider text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRedeemModalOpen(false)}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={redeemLoading || !inviteCode.trim()}
              className="btn btn-primary text-xs"
            >
              {redeemLoading ? 'Verifying...' : 'Join Team'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
