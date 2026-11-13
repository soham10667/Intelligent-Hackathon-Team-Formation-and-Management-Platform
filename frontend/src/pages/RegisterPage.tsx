import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  college_org: z.string().min(2, 'Organization or university is required'),
  country: z.string().min(2, 'Country is required'),
  timezone: z.string().default('UTC'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      timezone: 'UTC',
    }
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setServerError(null);
    try {
      await registerAuth({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        college_org: data.college_org,
        country: data.country,
        timezone: data.timezone,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Failed to register account');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <Users className="w-4 h-4 text-slate-100" />
          </div>
          <h1 className="text-lg font-semibold text-slate-950 tracking-tight">Create Participant Account</h1>
          <p className="text-xs text-slate-500">Register to join hackathons and form complementary teams</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                placeholder="Ada Lovelace"
                {...register('full_name')}
                className={`w-full px-3 py-2 rounded text-xs border focus-ring ${
                  errors.full_name ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.full_name && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="developer@example.com"
                {...register('email')}
                className={`w-full px-3 py-2 rounded text-xs border focus-ring ${
                  errors.email ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* College or Organization */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Organization / University</label>
              <input
                type="text"
                placeholder="MIT / DeepMind"
                {...register('college_org')}
                className={`w-full px-3 py-2 rounded text-xs border focus-ring ${
                  errors.college_org ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.college_org && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.college_org.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Country</label>
              <input
                type="text"
                placeholder="United States / India"
                {...register('country')}
                className={`w-full px-3 py-2 rounded text-xs border focus-ring ${
                  errors.country ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.country && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Time Zone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Time Zone</label>
            <select
              {...register('timezone')}
              className="w-full px-3 py-2 rounded text-xs border border-slate-200 bg-white focus-ring text-slate-700"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="UTC+5:30">UTC+5:30 (India Standard Time)</option>
              <option value="UTC-5">UTC-5 (Eastern Standard Time)</option>
              <option value="UTC-8">UTC-8 (Pacific Standard Time)</option>
              <option value="UTC+1">UTC+1 (Central European Time)</option>
              <option value="UTC+8">UTC+8 (Singapore / Western Australia)</option>
              <option value="UTC+9">UTC+9 (Japan Standard Time)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  {...register('password')}
                  className={`w-full pl-3 pr-8 py-2 rounded text-xs border focus-ring ${
                    errors.password ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  {...register('confirm_password')}
                  className={`w-full pl-3 pr-8 py-2 rounded text-xs border focus-ring ${
                    errors.confirm_password ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

