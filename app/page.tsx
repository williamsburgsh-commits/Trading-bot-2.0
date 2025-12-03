'use client';

import { useEffect, useState } from 'react';

interface Signal {
  id?: string;
  asset: string;
  type: string;
  entry: number;
  tp?: string | number;
  sl?: string | number;
  status?: string;
  timestamp?: string;
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/signals');
        const data = await res.json();
        setSignals(data.signals || []);
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch signals');
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Trading Signals Dashboard</h1>
        <p className="text-gray-400 mb-8">Real-time crypto and forex signals</p>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && signals.length === 0 && !error && (
          <div className="text-center py-12 bg-slate-700 rounded-lg">
            <p className="text-gray-300 text-lg">No signals available yet</p>
            <p className="text-gray-400 mt-2">Signals will appear here when generated</p>
          </div>
        )}

        {!loading && signals.length > 0 && (
          <div className="space-y-4">
            <p className="text-gray-300">Total signals: {signals.length}</p>
            <div className="grid gap-4">
              {signals.map((signal, idx) => (
                <div key={idx} className="border border-gray-600 rounded-lg p-6 bg-slate-700 hover:bg-slate-600 transition">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Asset</p>
                      <p className="text-lg font-bold">{signal.asset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Type</p>
                      <p className={`text-lg font-bold ${signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Entry</p>
                      <p className="text-lg font-bold">${signal.entry.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">TP</p>
                      <p className="text-lg font-bold">${signal.tp || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">SL</p>
                      <p className="text-lg font-bold">${signal.sl || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Status</p>
                      <p className="text-lg font-bold">{signal.status || 'Active'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 p-6 bg-yellow-900 border border-yellow-700 rounded-lg text-yellow-100">
          <p className="font-bold">⚠️ Risk Disclaimer</p>
          <p className="text-sm mt-2">Trading signals are for informational purposes only. Past performance does not guarantee future results. All trading involves risk. Only trade with capital you can afford to lose.</p>
        </div>
      </div>
    </div>
  );
}
