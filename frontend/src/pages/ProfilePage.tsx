import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [preferredRole, setPreferredRole] = useState(user?.preferred_role || 'Full Stack Developer');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'Intermediate');
  const [availabilityHours, setAvailabilityHours] = useState(user?.availability_hours_per_week || 20);
  const [workingHours, setWorkingHours] = useState(user?.preferred_working_hours || 'Flexible');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || '');

  // Skills
  const [skills, setSkills] = useState(
    user?.skills?.map((s) => ({ skill_name: s.skill_name, proficiency: s.proficiency, category: s.category })) || []
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState(3);
  const [newSkillCategory, setNewSkillCategory] = useState('general');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([
      ...skills,
      { skill_name: newSkillName.trim(), proficiency: newSkillProf, category: newSkillCategory },
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const updated = await api.updateProfile({
        headline,
        bio,
        preferred_role: preferredRole,
        experience_level: experienceLevel,
        availability_hours_per_week: Number(availabilityHours),
        preferred_working_hours: workingHours,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        skills,
      });
      updateUser(updated);
      setSuccess('Profile specifications updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile specifications');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="panel p-5 space-y-1">
        <h1 className="text-xl font-bold text-slate-950 tracking-tight">
          Developer Profile & Preferences
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          Keep your skills and working availability updated to ensure precision team matching and compatibility scoring.
        </p>
      </div>

      <div>
        {success && (
          <div className="mb-6 p-3 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Information Panel */}
          <div className="panel p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-950">Identity & Specialization</h2>
              <p className="text-xs text-slate-500 mt-0.5">Basic profile information visible in participant discovery.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Backend Engineer specializing in Distributed Systems"
                className="input text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Bio & Experience Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe what you enjoy building, past hackathons, and current interests..."
                className="input text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Preferred Role</label>
                <select
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  className="input text-xs bg-white"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="input text-xs bg-white"
                >
                  <option value="Beginner">Beginner (0-1 yrs)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Advanced">Advanced (3-5 yrs)</option>
                  <option value="Expert">Expert (5+ yrs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Time & Availability Panel */}
          <div className="panel p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-950">Availability & Coordination</h2>
              <p className="text-xs text-slate-500 mt-0.5">Used by the compatibility algorithm to match timezone alignment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Weekly Commitment (Hours/Week)</label>
                <input
                  type="number"
                  min={5}
                  max={80}
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(Number(e.target.value))}
                  className="input text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Preferred Schedule</label>
                <select
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="input text-xs bg-white"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Morning">Morning (8 AM - 12 PM)</option>
                  <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="Evening">Evening (5 PM - 10 PM)</option>
                  <option value="Night">Night Owl (10 PM - 4 AM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Skills Panel */}
          <div className="panel p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Verified Technical Skills</h2>
                <p className="text-xs text-slate-500 mt-0.5">Directly influences the skill gap analyzer and team compatibility score.</p>
              </div>
              <span className="font-mono text-xs text-slate-500">{skills.length} skills</span>
            </div>

            {/* Existing Skills Badges */}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-800 border border-slate-200"
                >
                  <span>{s.skill_name}</span>
                  <span className="text-blue-600 font-semibold">({s.proficiency}/5)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                    title="Remove skill"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Skill Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Skill name (e.g. PyTorch, React, Go, Docker)..."
                className="input text-xs flex-1 w-full"
              />
              <select
                value={newSkillProf}
                onChange={(e) => setNewSkillProf(Number(e.target.value))}
                className="input text-xs w-full sm:w-36 bg-white font-mono"
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Familiar</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn btn-secondary text-xs w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill
              </button>
            </div>
          </div>

          {/* Social Profiles Panel */}
          <div className="panel p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-950">Links & External Repositories</h2>
              <p className="text-xs text-slate-500 mt-0.5">Allows prospective teammates to evaluate past projects.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="input text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="input text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Personal Website / Portfolio</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs px-6 py-2"
            >
              {saving ? 'Persisting changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
