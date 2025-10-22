import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Trade {
  trade_id: string;
  trade_date: string;
  trader: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  trade_price: number;
  currency: string;
}

interface TradeListProps {
  trades: Trade[];
  loading: boolean;
}

export function TradeList({ trades, loading }: TradeListProps) {
  if (loading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Activity className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No trades found. Upload a CSV to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
      <h3 className="text-white mb-6">Trade History</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-slate-400">Trade ID</th>
              <th className="text-left py-3 px-4 text-slate-400">Date</th>
              <th className="text-left py-3 px-4 text-slate-400">Trader</th>
              <th className="text-left py-3 px-4 text-slate-400">Instrument</th>
              <th className="text-left py-3 px-4 text-slate-400">Side</th>
              <th className="text-right py-3 px-4 text-slate-400">Quantity</th>
              <th className="text-right py-3 px-4 text-slate-400">Price</th>
              <th className="text-left py-3 px-4 text-slate-400">Currency</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr
                key={`${trade.trade_id}-${trade.trade_date}-${index}`}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-4 px-4 text-purple-400">{trade.trade_id}</td>
                <td className="py-4 px-4 text-slate-300">
                  {new Date(trade.trade_date).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-slate-300">{trade.trader}</td>
                <td className="py-4 px-4 text-slate-300">{trade.instrument}</td>
                <td className="py-4 px-4">
                  <Badge
                    className={
                      trade.side === 'BUY'
                        ? 'bg-green-600/20 text-green-400 border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border-red-600/30'
                    }
                  >
                    {trade.side === 'BUY' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {trade.side}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  {trade.quantity.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  ${trade.trade_price.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-slate-300">{trade.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
