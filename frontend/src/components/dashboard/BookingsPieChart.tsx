import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card } from '../common/Card';

interface BookingsPieChartProps {
  title?: string;
  data?: Array<{ name: string; value: number; color: string }>;
}

const DEFAULT_STATUS_DATA = [
  { name: 'Completed', value: 48, color: '#059669' },
  { name: 'Confirmed Active', value: 24, color: '#0284c7' },
  { name: 'Awaiting Payment', value: 16, color: '#f59e0b' },
  { name: 'Cancelled / Expired', value: 8, color: '#e11d48' },
];

export const BookingsPieChart: React.FC<BookingsPieChartProps> = ({
  title = 'Reservation Lifecycle Distribution',
  data = DEFAULT_STATUS_DATA,
}) => {
  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between">
      <div className="mb-2">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">Distribution across all marketplace bookings</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`${val} bookings`, 'Volume']}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
