import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Award, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

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
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-sm text-slate-500">
          Keep your skills and working availability current so teammates and matching algorithms find you.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">General Information</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Backend Engineer specializing in Distributed Systems"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Bio & Introduction</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly describe what you enjoy building, past hackathons, and current interests..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Role</label>
              <select
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
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
              <label className="text-xs font-semibold text-slate-700">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="Beginner">Beginner (0-1 yrs)</option>
                <option value="Intermediate">Intermediate (1-3 yrs)</option>
                <option value="Advanced">Advanced (3-5 yrs)</option>
                <option value="Expert">Expert (5+ yrs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Working Hours & Availability */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Availability & Time Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Weekly Commitment (Hours/Week)</label>
              <input
                type="number"
                min={5}
                max={80}
                value={availabilityHours}
                onChange={(e) => setAvailabilityHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Working Hours</label>
              <select
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
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

        {/* Technical Skills Management */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Technical Skills</h2>
            <span className="text-xs text-slate-400 font-medium">{skills.length} skills listed</span>
          </div>

          {/* Existing Skills Badges */}
          <div className="flex flex-wrap gap-2">
            {skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200"
              >
                <span>{s.skill_name}</span>
                <span className="text-blue-600 font-bold">({s.proficiency}/5)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add New Skill */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g. PyTorch, React, Go)..."
              className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm"
            />
            <select
              value={newSkillProf}
              onChange={(e) => setNewSkillProf(Number(e.target.value))}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
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
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Portfolio & Profiles</h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">GitHub Profile URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Personal Website / Portfolio</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://myportfolio.dev"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
