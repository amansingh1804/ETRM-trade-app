import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: 'purple' | 'green' | 'orange' | 'blue';
}

export function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const colorClasses = {
    purple: 'bg-purple-600/20 text-purple-400',
    green: 'bg-green-600/20 text-green-400',
    orange: 'bg-orange-600/20 text-orange-400',
    blue: 'bg-blue-600/20 text-blue-400',
  };

  const gradientClasses = {
    purple: 'from-purple-600/10 to-transparent',
    green: 'from-green-600/10 to-transparent',
    orange: 'from-orange-600/10 to-transparent',
    blue: 'from-blue-600/10 to-transparent',
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400">{title}</p>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-white">{value}</p>
          {trend && (
            <span
              className={`${
                trend.startsWith('+') ? 'text-green-400' : 'text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
