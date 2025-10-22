import React from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './ui/card';

interface Trade {
  trade_id: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  trade_price: number;
  market_price?: number;
  mtm?: number;
  trade_date: string;
}

interface MtMCalculatorProps {
  trades: Trade[];
}

export function MtMCalculator({ trades }: MtMCalculatorProps) {
  // Filter trades that have market prices
  const valuedTrades = trades.filter(t => t.market_price !== undefined);
  
  // Calculate total MtM
  const totalMtM = valuedTrades.reduce((sum, t) => sum + (t.mtm || 0), 0);
  
  // Group by instrument
  const mtmByInstrument = valuedTrades.reduce((acc, trade) => {
    if (!acc[trade.instrument]) {
      acc[trade.instrument] = { mtm: 0, count: 0 };
    }
    acc[trade.instrument].mtm += trade.mtm || 0;
    acc[trade.instrument].count += 1;
    return acc;
  }, {} as Record<string, { mtm: number; count: number }>);

  const instrumentData = Object.entries(mtmByInstrument)
    .map(([instrument, data]) => ({ instrument, ...data }))
    .sort((a, b) => Math.abs(b.mtm) - Math.abs(a.mtm));

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-600/20 rounded-lg">
          <Calculator className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white">Mark-to-Market Calculation</h3>
          <p className="text-slate-400">MtM = (Market Price - Trade Price) × Quantity</p>
        </div>
      </div>

      {valuedTrades.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No trades with market prices available</p>
          <p className="text-sm mt-2">Upload market prices to calculate MtM</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total MtM Summary */}
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Total MtM P&L</p>
                <div className="flex items-center gap-2">
                  <span className={`${totalMtM >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalMtM.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {totalMtM >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 mb-1">Valued Trades</p>
                <p className="text-white">{valuedTrades.length} / {trades.length}</p>
              </div>
            </div>
          </div>

          {/* MtM by Instrument */}
          <div>
            <h4 className="text-white mb-4">MtM by Instrument</h4>
            <div className="space-y-3">
              {instrumentData.map(({ instrument, mtm, count }) => (
                <div
                  key={instrument}
                  className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-1">{instrument}</p>
                      <p className="text-slate-400">{count} trade{count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`${mtm >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${mtm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {mtm >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Calculation */}
          {valuedTrades.length > 0 && (
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
              <h4 className="text-blue-300 mb-3">Example Calculation</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const sample = valuedTrades[0];
                  return (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span>Trade:</span>
                        <span className="text-white">{sample.trade_id} ({sample.instrument})</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Market Price:</span>
                        <span className="text-white">${sample.market_price?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Trade Price:</span>
                        <span className="text-white">${sample.trade_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Quantity:</span>
                        <span className="text-white">{sample.quantity.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-blue-800/50 pt-2 mt-2 flex justify-between">
                        <span className="text-blue-300">MtM P&L:</span>
                        <span className={`${(sample.mtm || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${(sample.mtm || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-2 text-center">
                        ({sample.market_price?.toFixed(2)} - {sample.trade_price.toFixed(2)}) × {sample.quantity.toLocaleString()} = {(sample.mtm || 0).toFixed(2)}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
