import React, { useState, useEffect } from 'react';
import { adminService, PlatformStats } from '../../services/admin.service';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { BookingsPieChart } from '../../components/dashboard/BookingsPieChart';
import { Card } from '../../components/common/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, MapPin, Calendar, DollarSign } from 'lucide-react';

const HOURLY_UTILIZATION_DATA = [
  { hour: '08:00', occupancy: 35 },
  { hour: '10:00', occupancy: 72 },
  { hour: '12:00', occupancy: 88 },
  { hour: '14:00', occupancy: 91 },
  { hour: '16:00', occupancy: 82 },
  { hour: '18:00', occupancy: 65 },
  { hour: '20:00', occupancy: 42 },
];

const USER_GROWTH_DATA = [
  { month: 'Jul', drivers: 120, owners: 22 },
  { month: 'Aug', drivers: 210, owners: 38 },
  { month: 'Sep', drivers: 340, owners: 54 },
  { month: 'Oct', drivers: 480, owners: 72 },
  { month: 'Nov', drivers: 620, owners: 95 },
];

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    adminService.getPlatformStats().then(setStats);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Marketplace Analytics & Demand Forecasting
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics, hourly utilization profiles, and direct settlement velocity.
        </p>
      </div>

      {/* Row 1: Revenue & Status Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart
            title="Weekly Direct Settlement Velocity"
            subtitle="Driver payments confirmed by parking hosts across metropolitan hubs"
          />
        </div>
        <div className="lg:col-span-4">
          <BookingsPieChart
            title="Booking Lifecycle Breakdown"
            data={
              stats
                ? [
                    { name: 'Completed', value: stats.completedBookings, color: '#059669' },
                    { name: 'Confirmed Active', value: stats.activeBookings, color: '#0284c7' },
                    { name: 'Cancelled / Expired', value: stats.cancelledBookings, color: '#e11d48' },
                  ]
                : undefined
            }
          />
        </div>
      </div>

      {/* Row 2: Hourly Demand Utilization & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Utilization Bar Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Average Hourly Capacity Utilization</h3>
            <p className="text-xs text-slate-500">Peak demand cycles throughout operating hours</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_UTILIZATION_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" fontSize={11} stroke="#94a3b8" tickLine={false} />
                <YAxis
                  fontSize={11}
                  stroke="#94a3b8"
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}% Occupancy`, 'Utilization']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="occupancy" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Acquisition Trend */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">User Growth & Persona Split</h3>
            <p className="text-xs text-slate-500">Cumulative registered drivers and parking hosts</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USER_GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickLine={false} />
                <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="drivers" name="Drivers" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="owners" name="Parking Owners" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
