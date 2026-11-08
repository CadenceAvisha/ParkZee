import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '../common/Card';

interface RevenueChartProps {
  title?: string;
  subtitle?: string;
  data?: Array<{ date: string; amount: number; bookings: number }>;
}

const DEFAULT_CHART_DATA = [
  { date: 'Mon', amount: 840, bookings: 12 },
  { date: 'Tue', amount: 1260, bookings: 18 },
  { date: 'Wed', amount: 980, bookings: 14 },
  { date: 'Thu', amount: 1540, bookings: 22 },
  { date: 'Fri', amount: 2100, bookings: 31 },
  { date: 'Sat', amount: 2850, bookings: 42 },
  { date: 'Sun', amount: 2400, bookings: 35 },
];

export const RevenueChart: React.FC<RevenueChartProps> = ({
  title = 'Direct Settlement Revenue Trend',
  subtitle = 'Owner-confirmed direct cash & UPI receipts over the past 7 days',
  data = DEFAULT_CHART_DATA,
}) => {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              formatter={(value: any, name: any) => [
                name === 'amount' ? `₹${value}` : `${value} trips`,
                name === 'amount' ? 'Direct Revenue' : 'Reservations',
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#059669"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
