import React, { useState, useEffect } from 'react';
import { Upload, TrendingUp, DollarSign, Activity, Filter, X } from 'lucide-react';
import { TradeUpload } from './components/TradeUpload';
import { TradeList } from './components/TradeList';
import { PnLChart } from './components/PnLChart';
import { StatsCard } from './components/StatsCard';
import { MtMCalculator } from './components/MtMCalculator';
import { DataManagement } from './components/DataManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { projectId, publicAnonKey } from './utils/supabase/info';

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

interface TradeWithMtM extends Trade {
  market_price?: number;
  mtm?: number;
}

interface PnLData {
  totalPnL: number;
  dailyPnL: { date: string; pnl: number }[];
  tradeCount: number;
  valuedTradeCount: number;
  trades?: TradeWithMtM[];
}

interface Stats {
  totalTrades: number;
  uniqueInstruments: number;
  uniqueTraders: number;
  totalVolume: number;
  totalNotional: number;
}

export default function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [traders, setTraders] = useState<string[]>([]);
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedTrader, setSelectedTrader] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-65269444`;

  useEffect(() => {
    fetchTrades();
    fetchPnL();
    fetchStats();
    fetchInstruments();
    fetchTraders();
  }, []);

  useEffect(() => {
    fetchTrades();
    fetchPnL();
  }, [fromDate, toDate, selectedInstrument, selectedTrader, currentPage]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (selectedInstrument && selectedInstrument !== 'all') params.append('instrument', selectedInstrument);
      if (selectedTrader && selectedTrader !== 'all') params.append('trader', selectedTrader);

      const response = await fetch(`${baseUrl}/trades?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPnL = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (selectedInstrument && selectedInstrument !== 'all') params.append('instrument', selectedInstrument);

      const response = await fetch(`${baseUrl}/pnl?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setPnlData(data);
    } catch (error) {
      console.error('Error fetching P&L:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/stats`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchInstruments = async () => {
    try {
      const response = await fetch(`${baseUrl}/instruments`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setInstruments(data.instruments || []);
    } catch (error) {
      console.error('Error fetching instruments:', error);
    }
  };

  const fetchTraders = async () => {
    try {
      const response = await fetch(`${baseUrl}/traders`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setTraders(data.traders || []);
    } catch (error) {
      console.error('Error fetching traders:', error);
    }
  };

  const handleUploadSuccess = () => {
    fetchTrades();
    fetchPnL();
    fetchStats();
    fetchInstruments();
    fetchTraders();
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedInstrument('all');
    setSelectedTrader('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = fromDate || toDate || (selectedInstrument && selectedInstrument !== 'all') || (selectedTrader && selectedTrader !== 'all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white mb-2">ETRM Trade Capture & Dashboard</h1>
          <p className="text-slate-400">Energy Trading Risk Management System</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Trades"
            value={stats?.totalTrades || 0}
            icon={Activity}
            trend="+12%"
            color="purple"
          />
          <StatsCard
            title="Total P&L"
            value={`$${(pnlData?.totalPnL || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={pnlData?.totalPnL && pnlData.totalPnL > 0 ? '+' : ''}
            color="green"
          />
          <StatsCard
            title="Instruments"
            value={stats?.uniqueInstruments || 0}
            icon={TrendingUp}
            color="orange"
          />
          <StatsCard
            title="Total Volume"
            value={(stats?.totalVolume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            icon={Activity}
            color="blue"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 mb-6">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="trades" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              Trades
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              Upload
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              Manage Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white">Filters</h3>
                </div>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">From Date</label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">To Date</label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Instrument</label>
                  <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="All Instruments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Instruments</SelectItem>
                      {instruments.map((inst) => (
                        <SelectItem key={inst} value={inst}>
                          {inst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Trader</label>
                  <Select value={selectedTrader} onValueChange={setSelectedTrader}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="All Traders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Traders</SelectItem>
                      {traders.map((trader) => (
                        <SelectItem key={trader} value={trader}>
                          {trader}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* P&L Chart */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
              <h3 className="text-white mb-6">Daily P&L Performance</h3>
              <PnLChart data={pnlData?.dailyPnL || []} />
            </div>

            {/* MtM Calculator */}
            <MtMCalculator trades={pnlData?.trades || []} />
          </TabsContent>

          <TabsContent value="trades">
            <TradeList trades={trades} loading={loading} />
          </TabsContent>

          <TabsContent value="upload">
            <TradeUpload onSuccess={handleUploadSuccess} />
          </TabsContent>

          <TabsContent value="manage">
            <DataManagement onDataCleared={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
