import { motion } from 'framer-motion';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  delay?: number;
}

const COLOR_MAP = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-500', badge: 'bg-primary-100' },
  success: { bg: 'bg-success-50', icon: 'text-success-500', badge: 'bg-success-100' },
  warning: { bg: 'bg-warning-50', icon: 'text-warning-500', badge: 'bg-warning-100' },
  danger: { bg: 'bg-danger-50', icon: 'text-danger-500', badge: 'bg-danger-100' },
  accent: { bg: 'bg-accent-50', icon: 'text-accent-600', badge: 'bg-accent-100' },
};

export function StatsCard({ title, value, icon: Icon, change, changeLabel, color = 'primary', delay = 0 }: StatsCardProps) {
  const colors = COLOR_MAP[color];
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-success-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger-500" />
          )}
          <span className={cn('text-xs font-medium', isPositive ? 'text-success-600' : 'text-danger-600')}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </motion.div>
  );
}
