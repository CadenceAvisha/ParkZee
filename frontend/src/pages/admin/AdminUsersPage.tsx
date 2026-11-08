import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { User, AccountStatus, UserRole } from '../../types/user.types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import { Users, Search, ShieldAlert, CheckCircle2, UserX, UserCheck } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await adminService.getUsers();
      setUsers(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleAccountStatus = async (user: User) => {
    const nextStatus: AccountStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'suspended' ? 'suspend' : 'reactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} account for ${user.name}?`)) {
      return;
    }

    try {
      const updated = await adminService.updateUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        'success',
        `Account ${nextStatus === 'suspended' ? 'Suspended' : 'Reactivated'}`,
        `${user.name}'s account status has been updated.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      showToast('error', 'Error', msg);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review drivers, property hosts, and platform administrators. Enforce account status policies.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('driver')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'driver' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Drivers ({users.filter((u) => u.role === 'driver').length})
          </button>
          <button
            onClick={() => setRoleFilter('owner')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'owner' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Owners ({users.filter((u) => u.role === 'owner').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} className="h-14 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10b981&color=fff`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'owner'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-brand-50 text-brand-700 border-brand-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {u.accountStatus === 'active' ? (
                        <Badge variant="emerald" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="rose" dot>
                          Suspended
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant={u.accountStatus === 'active' ? 'outline' : 'primary'}
                          className={`text-[11px] py-1 px-2.5 ${
                            u.accountStatus === 'active'
                              ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              : ''
                          }`}
                          onClick={() => handleToggleAccountStatus(u)}
                        >
                          {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
