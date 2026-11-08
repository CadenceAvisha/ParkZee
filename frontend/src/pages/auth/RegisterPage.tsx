import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Car, Lock, Mail, User, Phone, Eye, EyeOff, Building, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'driver',
      acceptTerms: true,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const user = await registerUser(data);
      showToast(
        'success',
        'Registration Successful!',
        `Welcome to ParkZee, ${user.name}. Your account is ready.`
      );
      if (user.role === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/driver/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      showToast('error', 'Registration Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            Park<span className="text-brand-600">Zee</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-premium rounded-2xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Type Selector (Driver vs Parking Owner) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Choose Account Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'driver')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedRole === 'driver'
                      ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Car className="w-5 h-5 mb-1.5 text-brand-600" />
                  <span>I am a Driver</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Find and book parking
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'owner')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedRole === 'owner'
                      ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-5 h-5 mb-1.5 text-teal-600" />
                  <span>I am a Parking Owner</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                    List space & collect rent
                  </span>
                </button>
              </div>
              {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>}
            </div>

            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Phone Number */}
            <Input
              label="Mobile Phone Number"
              type="tel"
              placeholder="9876543210"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Password */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 chars, 1 uppercase, 1 number"
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

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Terms and Policy */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                  {...register('acceptTerms')}
                />
                <span>
                  I agree to the ParkZee Terms of Service, Privacy Policy, and direct driver-to-owner settlement guidelines.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-rose-600">{errors.acceptTerms.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
