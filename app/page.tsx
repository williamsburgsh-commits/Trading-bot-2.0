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
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8">Trading Signals Dashboard</h1>
      
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading signals...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && signals.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600">No signals available yet</p>
        </div>
      )}

      {!loading && signals.length > 0 && (
        <div className="grid gap-4">
          {signals.map((signal, idx) => (
            <div key={idx} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Asset</p>
                  <p className="text-lg font-bold">{signal.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-bold">{signal.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Entry</p>
                  <p className="text-lg font-bold">${signal.entry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Take Profit</p>
                  <p className="text-lg font-bold">${signal.tp || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stop Loss</p>
                  <p className="text-lg font-bold">${signal.sl || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-bold">{signal.status || 'Active'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
