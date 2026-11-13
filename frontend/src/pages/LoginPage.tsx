import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'admin@hackathon.io');
    setValue('password', 'Hackathon2026!');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <Users className="w-4 h-4 text-slate-100" />
          </div>
          <h1 className="text-lg font-semibold text-slate-950 tracking-tight">Sign in to TeamForge</h1>
          <p className="text-xs text-slate-500">Access your hackathon teams and real-time requests</p>
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
          
          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Demo Credentials</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Autofill
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">admin@hackathon.io / Hackathon2026!</p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          New participant?{' '}
          <Link to="/register" className="font-medium text-slate-900 hover:underline">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};

