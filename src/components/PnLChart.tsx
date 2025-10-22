import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PnLChartProps {
  data: { date: string; pnl: number }[];
}

export function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        No P&L data available. Upload market prices to calculate P&L.
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pnl: item.pnl,
    displayPnL: item.pnl.toFixed(2)
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 mb-1">{payload[0].payload.date}</p>
          <p className={`${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#ec4899" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickLine={{ stroke: '#334155' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#a855f7"
            strokeWidth={3}
            fill="url(#pnlGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
