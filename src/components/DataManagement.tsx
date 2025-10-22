import React, { useState, useEffect } from 'react';
import { Trash2, Database, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DataManagementProps {
  onDataCleared: () => void;
}

export function DataManagement({ onDataCleared }: DataManagementProps) {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [stats, setStats] = useState<{ trades: number; prices: number } | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-65269444`;

  useEffect(() => {
    checkDatabaseConnection();
    fetchDataStats();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setDbStatus(data.success ? 'connected' : 'error');
    } catch (error) {
      console.error('Database health check failed:', error);
      setDbStatus('error');
    }
  };

  const fetchDataStats = async () => {
    try {
      const [tradesRes, pricesRes] = await Promise.all([
        fetch(`${baseUrl}/trades?limit=1000`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`${baseUrl}/market-prices`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const tradesData = await tradesRes.json();
      const pricesData = await pricesRes.json();

      setStats({
        trades: tradesData.pagination?.total || 0,
        prices: pricesData.prices?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data stats:', error);
    }
  };

  const handleDelete = async (type: 'trades' | 'prices' | 'all') => {
    setDeleting(true);
    setMessage(null);

    try {
      const endpoint =
        type === 'all'
          ? '/all-data'
          : type === 'trades'
          ? '/trades'
          : '/market-prices';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      setMessage({ type: 'success', text: data.message });
      onDataCleared();
      fetchDataStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Status */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${
            dbStatus === 'connected' ? 'bg-green-600/20' :
            dbStatus === 'error' ? 'bg-red-600/20' : 'bg-yellow-600/20'
          }`}>
            <Database className={`w-6 h-6 ${
              dbStatus === 'connected' ? 'text-green-400' :
              dbStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`} />
          </div>
          <div>
            <h3 className="text-white">Database Connection Status</h3>
            <p className={`${
              dbStatus === 'connected' ? 'text-green-400' :
              dbStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {dbStatus === 'connected' ? '✓ Connected to Supabase KV Store' :
               dbStatus === 'error' ? '✗ Connection Failed' : '⟳ Checking...'}
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
              <p className="text-slate-400 mb-1">Trades Stored</p>
              <p className="text-white">{stats.trades.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
              <p className="text-slate-400 mb-1">Market Prices Stored</p>
              <p className="text-white">{stats.prices.toLocaleString()}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Data Management */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-600/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-white">Data Management</h3>
            <p className="text-slate-400">Remove uploaded data from the database</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200">
                <p className="mb-1">⚠️ Warning: These actions cannot be undone</p>
                <p className="text-yellow-300/80">Make sure you have backups of any important data before proceeding.</p>
              </div>
            </div>
          </div>

          {/* Delete Trades */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800 hover:bg-red-950/30"
                disabled={deleting || stats?.trades === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Trades ({stats?.trades || 0})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete All Trades?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete all {stats?.trades || 0} trade records from the database.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete('trades')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Trades
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Market Prices */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800 hover:bg-red-950/30"
                disabled={deleting || stats?.prices === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Market Prices ({stats?.prices || 0})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete All Market Prices?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete all {stats?.prices || 0} market price records from the database.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete('prices')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Prices
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete All Data */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-red-800 text-red-400 hover:text-red-300 hover:border-red-700 hover:bg-red-950/50"
                disabled={deleting || (stats?.trades === 0 && stats?.prices === 0)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear ALL Data (Trades + Prices)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">⚠️ Delete Everything?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete ALL data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{stats?.trades || 0} trade records</li>
                    <li>{stats?.prices || 0} market price records</li>
                  </ul>
                  <p className="mt-3 text-red-400">This action cannot be undone!</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete('all')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Status Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-950/50 border-green-800' : 'bg-red-950/50 border-red-800'}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
