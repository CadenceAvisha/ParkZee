import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Car, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'driver@parkzee.com',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const user = await login(data);
      showToast('success', 'Welcome Back!', `Logged in successfully as ${user.name}`);
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        const dest =
          user.role === 'admin'
            ? '/admin/dashboard'
            : user.role === 'owner'
            ? '/owner/dashboard'
            : '/driver/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      showToast('error', 'Authentication Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            Park<span className="text-brand-600">Zee</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Or{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            register for a new Driver or Owner account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-premium rounded-2xl border border-slate-200/80 sm:px-10">
          {/* 1-Click Quick Demo Switcher */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick Test Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('driver@parkzee.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-lg font-medium text-slate-700 transition-colors"
              >
                🚗 Driver
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('owner@parkzee.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-lg font-medium text-slate-700 transition-colors"
              >
                🏢 Owner
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@parkzee.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-lg font-medium text-slate-700 transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...register('password')}
                />
              </div>

              <div className="flex items-center justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
