import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'brand' | 'blue' | 'amber' | 'emerald' | 'slate';
  change?: string;
  isPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'brand',
  change,
  isPositive = true,
}) => {
  const iconColors = {
    brand: 'text-brand-600 bg-brand-50 border-brand-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {change && (
            <p
              className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{change}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${iconColors[variant]} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};
