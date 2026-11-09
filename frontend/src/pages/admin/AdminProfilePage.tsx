import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { ShieldCheck, UserRound } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="text-sm font-medium text-emerald-800">Account</p><h1 className="mt-1 text-2xl font-semibold text-stone-950">Administrator profile</h1></div>
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><UserRound className="h-7 w-7" /></span>
          <div><h2 className="text-lg font-semibold text-stone-950">{user?.name}</h2><p className="text-sm text-stone-500">{user?.email}</p></div>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-stone-50 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-800" /><div><p className="text-sm font-semibold text-stone-900">Administrator access</p><p className="mt-1 text-sm leading-5 text-stone-600">This role is assigned by ParkZee through its server-side administrator setup.</p></div></div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Account type</dt><dd className="mt-1 text-sm font-medium text-stone-900">Administrator</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Status</dt><dd className="mt-1 text-sm font-medium capitalize text-stone-900">{user?.accountStatus}</dd></div></dl>
      </Card>
    </div>
  );
};
