import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Eye, EyeOff, Lock, Mail, User, School, Globe, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  college_org: z.string().min(2, 'Please enter your organization or university'),
  country: z.string().min(2, 'Please enter your country'),
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-lg p-8 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Your Profile</h2>
          <p className="text-xs text-slate-500">Join hackathons and connect with complementary teammates</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  {...register('full_name')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.full_name ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-[11px] text-red-600 font-medium">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="developer@example.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.email ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* College or Organization */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">College / Organization</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Stanford / DeepMind"
                  {...register('college_org')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.college_org ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.college_org && (
                <p className="text-[11px] text-red-600 font-medium">{errors.college_org.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Country</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="United States / India"
                  {...register('country')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.country ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.country && (
                <p className="text-[11px] text-red-600 font-medium">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Time Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Time Zone</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                {...register('timezone')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-all"
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="UTC+5:30">UTC+5:30 (India Standard Time)</option>
                <option value="UTC-5">UTC-5 (Eastern Time US)</option>
                <option value="UTC-8">UTC-8 (Pacific Time US)</option>
                <option value="UTC+1">UTC+1 (Central European Time)</option>
                <option value="UTC+8">UTC+8 (Singapore / Beijing)</option>
                <option value="UTC+9">UTC+9 (Japan Standard Time)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.password ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  {...register('confirm_password')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.confirm_password ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-[11px] text-red-600 font-medium">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
};
