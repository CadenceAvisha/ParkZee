import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Building2, CarFront, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'driver' },
  });
  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const user = await registerUser(data);
      showToast('success', 'Account created', `Welcome to ParkZee, ${user.name}.`);
      navigate(user.role === 'owner' ? '/owner/dashboard' : '/driver/dashboard', { replace: true });
    } catch (err) {
      showToast('error', 'Could not create account', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleCard = (role: 'driver' | 'owner', title: string, detail: string, Icon: typeof CarFront) => (
    <button type="button" aria-pressed={selectedRole === role} onClick={() => setValue('role', role, { shouldValidate: true })} className={`flex min-h-[92px] items-center gap-3 rounded-xl border p-4 text-left transition ${selectedRole === role ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedRole === role ? 'bg-white text-emerald-800' : 'bg-stone-100 text-stone-500'}`}><Icon className="h-5 w-5" /></span>
      <span><span className="block text-sm font-semibold text-stone-900">{title}</span><span className="mt-1 block text-xs leading-5 text-stone-500">{detail}</span></span>
    </button>
  );

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-6xl items-center px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-10">
        <Link to="/" className="mb-7 inline-flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white"><CarFront className="h-5 w-5" /></span><span className="text-xl font-semibold">Park<span className="text-emerald-700">Zee</span></span></Link>
        <p className="text-sm font-medium text-emerald-800">Join the marketplace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">Create your account</h1>
        <p className="mt-2 text-sm text-stone-600">Choose how you’ll use ParkZee. You can’t create an administrator account here.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {roleCard('driver', 'User / Driver', 'Find and reserve parking', CarFront)}
            {roleCard('owner', 'Parking Owner', 'List spaces and manage bookings', Building2)}
          </div>
          {errors.role && <p className="text-sm text-rose-600">{errors.role.message}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" type="text" autoComplete="name" placeholder="Your name" leftIcon={<UserRound className="h-4 w-4" />} error={errors.name?.message} {...register('name')} />
            <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
          </div>
          <Input label="Phone number" type="tel" autoComplete="tel" placeholder="10-digit mobile number" leftIcon={<Phone className="h-4 w-4" />} error={errors.phone?.message} {...register('phone')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="8+ characters, uppercase and number" leftIcon={<LockKeyhole className="h-4 w-4" />} error={errors.password?.message} rightIcon={<button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-stone-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} {...register('password')} />
            <Input label="Confirm password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" leftIcon={<LockKeyhole className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </div>
          <div className="pt-1">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-stone-600"><input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600" {...register('acceptTerms')} /><span>I agree to the ParkZee terms, privacy policy, and direct settlement guidelines.</span></label>
            {errors.acceptTerms && <p className="mt-1 text-sm text-rose-600">{errors.acceptTerms.message}</p>}
          </div>
          <Button type="submit" variant="primary" size="md" className="w-full !bg-emerald-800 hover:!bg-emerald-900" isLoading={isSubmitting}>Create account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">Already have an account? <Link to="/login" className="font-semibold text-emerald-800 hover:text-emerald-950">Sign in</Link></p>
      </section>
    </main>
  );
};
