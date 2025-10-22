import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TradeUploadProps {
  onSuccess: () => void;
}

export function TradeUpload({ onSuccess }: TradeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-65269444`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${baseUrl}/trades/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      if (data.validCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMarketPricesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${baseUrl}/market-prices/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Upload Trades */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-600/20 rounded-lg">
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white">Upload Trades</h3>
            <p className="text-slate-400">Upload a CSV file containing trade data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-purple-600/50 transition-colors">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <label htmlFor="trade-upload" className="cursor-pointer">
              <span className="text-white hover:text-purple-400 transition-colors">
                Click to upload trades CSV
              </span>
              <input
                id="trade-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-slate-500 mt-2">CSV format: trade_id, trade_date, trader, instrument, side, quantity, trade_price, currency</p>
          </div>
        </div>
      </Card>

      {/* Upload Market Prices */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-600/20 rounded-lg">
            <FileText className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white">Upload Market Prices</h3>
            <p className="text-slate-400">Upload a CSV file containing market closing prices</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-orange-600/50 transition-colors">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <label htmlFor="price-upload" className="cursor-pointer">
              <span className="text-white hover:text-orange-400 transition-colors">
                Click to upload market prices CSV
              </span>
              <input
                id="price-upload"
                type="file"
                accept=".csv"
                onChange={handleMarketPricesUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-slate-500 mt-2">CSV format: instrument, price_date, close_price</p>
          </div>
        </div>
      </Card>

      {/* Upload Result */}
      {uploadResult && (
        <Alert className="bg-green-950/50 border-green-800">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <AlertDescription className="text-green-200">
            {uploadResult.message}
            {uploadResult.invalidCount > 0 && (
              <span className="block mt-2 text-yellow-400">
                {uploadResult.invalidCount} invalid row(s) were skipped
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert className="bg-red-950/50 border-red-800">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Schema Information */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
        <h3 className="text-white mb-4">CSV Schema Reference</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-purple-400 mb-2">Trades CSV Format:</h4>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <code className="text-slate-300">
                trade_id, trade_date, trader, instrument, side, quantity, trade_price, currency
              </code>
            </div>
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>• <strong>side:</strong> Must be BUY or SELL</li>
              <li>• <strong>quantity:</strong> Numeric value</li>
              <li>• <strong>trade_price:</strong> Numeric value</li>
              <li>• <strong>trade_date:</strong> Format YYYY-MM-DD</li>
            </ul>
          </div>
          <div>
            <h4 className="text-orange-400 mb-2">Market Prices CSV Format:</h4>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <code className="text-slate-300">
                instrument, price_date, close_price
              </code>
            </div>
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>• <strong>instrument:</strong> Must match trade instruments</li>
              <li>• <strong>price_date:</strong> Format YYYY-MM-DD</li>
              <li>• <strong>close_price:</strong> Numeric value</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
