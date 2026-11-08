import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService, PlatformStats } from '../../services/admin.service';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { BookingsPieChart } from '../../components/dashboard/BookingsPieChart';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Shield,
  Users,
  MapPin,
  Calendar,
  AlertOctagon,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getPlatformStats();
        setStats(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton count={4} className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Welcome Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-premium">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded-full border border-brand-800">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Platform Governance & Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitor ecosystem health, approve submitted parking spaces, oversee direct transactions, and enforce marketplace integrity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<MapPin className="w-4 h-4" />}
            onClick={() => navigate('/admin/listings')}
          >
            Review Listings ({stats.pendingApprovals})
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Users className="w-4 h-4" />}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
        </div>
      </div>

      {/* Primary Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.totalDrivers} Drivers • ${stats.totalOwners} Owners`}
          icon={Users}
          variant="brand"
        />
        <StatCard
          title="Parking Listings"
          value={stats.totalParkingLocations}
          subtitle={`${stats.pendingApprovals} Pending Verification`}
          icon={MapPin}
          variant="blue"
        />
        <StatCard
          title="Active Reservations"
          value={stats.activeBookings}
          subtitle={`${stats.completedBookings} Completed Lifetime`}
          icon={Calendar}
          variant="amber"
        />
        <StatCard
          title="Direct Settlement Volume"
          value={`₹${stats.totalDirectRevenueConfirmed}`}
          subtitle="Owner-confirmed offline settlements"
          icon={DollarSign}
          variant="emerald"
        />
      </div>

      {/* Pending Approvals Callout (if any) */}
      {stats.pendingApprovals > 0 && (
        <Card className="p-5 border-amber-300 bg-amber-50/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                {stats.pendingApprovals} Parking {stats.pendingApprovals === 1 ? 'Listing' : 'Listings'} Awaiting Verification
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                New listings cannot be booked by drivers until approved by an administrator.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/listings')}
          >
            Review Submissions
          </Button>
        </Card>
      )}

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart
            title="Platform Settlement Volume"
            subtitle="Aggregated direct driver-to-owner receipts across all registered parking facilities"
          />
        </div>
        <div className="lg:col-span-4">
          <BookingsPieChart />
        </div>
      </div>
    </div>
  );
};
