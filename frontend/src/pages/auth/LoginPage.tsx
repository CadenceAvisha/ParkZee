import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CarFront, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { UserRole } from '../../types/user.types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const loginRoles: { role: UserRole; title: string; detail: string; Icon: typeof CarFront }[] = [
  { role: 'driver', title: 'User / Driver', detail: 'Find and reserve a space', Icon: CarFront },
  { role: 'owner', title: 'Parking Owner', detail: 'Manage your parking spaces', Icon: Building2 },
  { role: 'admin', title: 'Administrator', detail: 'Manage ParkZee', Icon: ShieldCheck },
];

const dashboardFor = (role: UserRole) => role === 'admin' ? '/admin/dashboard' : role === 'owner' ? '/owner/dashboard' : '/driver/dashboard';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const user = await login(data, selectedRole);
      showToast('success', 'Welcome to ParkZee', `Signed in as ${user.name}`);
      navigate(dashboardFor(user.role), { replace: true });
    } catch (err) {
      showToast('error', 'Could not sign in', err instanceof Error ? err.message : 'Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5 md:grid-cols-[.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-[#102b22] p-10 text-white md:flex">
          <Link to="/" className="inline-flex items-center gap-3 self-start" aria-label="ParkZee home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500"><CarFront className="h-6 w-6" /></span>
            <span className="text-2xl font-semibold tracking-tight">Park<span className="text-emerald-300">Zee</span></span>
          </Link>
          <div><p className="text-sm font-medium text-emerald-300">Good to have you back</p><h1 className="mt-3 text-4xl font-semibold leading-tight">Your next stop starts here.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/75">Sign in to find a space, manage your property, or take care of the ParkZee community.</p></div>
          <p className="text-xs text-emerald-100/60">Parking made a little easier.</p>
        </aside>

        <section className="p-6 sm:p-10 lg:p-12">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 md:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white"><CarFront className="h-5 w-5" /></span><span className="text-xl font-semibold">Park<span className="text-emerald-700">Zee</span></span></Link>
          <p className="text-sm font-medium text-emerald-800">Welcome back</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">Sign in to ParkZee</h2>
          <p className="mt-2 text-sm text-stone-600">Choose your account type to continue.</p>

          <div className="mt-6 grid grid-cols-3 gap-2" role="group" aria-label="Account type">
            {loginRoles.map(({ role, title, detail, Icon }) => (
              <button key={role} type="button" aria-pressed={selectedRole === role} onClick={() => setSelectedRole(role)} className={`flex min-h-[104px] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition ${selectedRole === role ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700' : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}>
                <Icon className={`mb-2 h-5 w-5 ${selectedRole === role ? 'text-emerald-800' : 'text-stone-400'}`} />
                <span className="text-xs font-semibold sm:text-sm">{title}</span>
                <span className="mt-1 hidden text-[11px] text-stone-500 sm:block">{detail}</span>
              </button>
            ))}
          </div>
          {selectedRole === 'admin' && <p className="mt-2 text-xs text-stone-500">Administrator accounts are created by ParkZee. Public sign-up is not available for this role.</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            <Input label="Email address" type="email" autoComplete="username" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" leftIcon={<LockKeyhole className="h-4 w-4" />} error={errors.password?.message} rightIcon={<button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-stone-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} {...register('password')} />
            <div className="-mt-1 flex justify-end"><Link to="/forgot-password" className="text-sm font-medium text-emerald-800 hover:text-emerald-950">Forgot password?</Link></div>
            <Button type="submit" variant="primary" size="md" className="w-full !bg-emerald-800 hover:!bg-emerald-900" isLoading={isSubmitting}>Sign in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-600">New to ParkZee? <Link to="/register" className="font-semibold text-emerald-800 hover:text-emerald-950">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
};
