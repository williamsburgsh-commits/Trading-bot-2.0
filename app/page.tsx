'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals');
        const data = await res.json();
        setSignals(data.signals || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch signals');
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Trading Signals</h1>
      {signals.length === 0 ? (
        <p>No signals yet</p>
      ) : (
        <div className="space-y-4">
          {signals.map((s: any, i: number) => (
            <div key={i} className="border p-4 rounded">
              <p>
                <strong>{s.asset}</strong> - {s.type}
              </p>
              <p>
                Entry: {s.entry} | TP: {s.tp} | SL: {s.sl}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
