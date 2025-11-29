'use client';

import { useState, useEffect, useCallback } from 'react';
import { Signal, SignalsResponse, FilterOptions } from '@/lib/types';
import { SignalsTable } from '@/components/signals-table';
import { SignalsGrid } from '@/components/signals-grid';
import { SignalsFilter } from '@/components/signals-filter';
import { MetricsCard } from '@/components/metrics-card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Grid, List } from 'lucide-react';

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState({
    winRate: 0,
    avgProfit: 0,
    totalSignals: 0,
    closedSignals: 0,
    activeSignals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Extract unique assets from signals
  const uniqueAssets = Array.from(
    new Set(signals.map((s) => s.asset))
  ).sort();

  const fetchSignals = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.asset) params.append('asset', filters.asset);
      if (filters.assetType) params.append('assetType', filters.assetType);
      if (filters.signalType) params.append('signalType', filters.signalType);

      const response = await fetch(`/api/signals?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch signals: ${response.status} ${response.statusText}`);
      }
      
      const data: SignalsResponse = await response.json();

      setSignals(data.signals);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch signals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch signals');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      fetchSignals();
    }, refreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, fetchSignals]);

  const determineTrend = (value: number) => {
    if (value > 0) return 'up' as const;
    if (value < 0) return 'down' as const;
    return 'neutral' as const;
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Trading Signals Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time monitoring and analytics for your trading signals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                Auto-refresh:
              </label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border border-input"
              />
            </div>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
              </select>
            )}
            <Button
              onClick={() => fetchSignals()}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricsCard
            label="Active Signals"
            value={metrics.activeSignals}
            format="number"
          />
          <MetricsCard
            label="Total Signals"
            value={metrics.totalSignals}
            format="number"
          />
          <MetricsCard
            label="Closed Signals"
            value={metrics.closedSignals}
            format="number"
          />
          <MetricsCard
            label="Win Rate"
            value={metrics.winRate}
            trend={determineTrend(metrics.winRate)}
            format="percent"
          />
          <MetricsCard
            label="Avg Profit"
            value={metrics.avgProfit}
            trend={determineTrend(metrics.avgProfit)}
            format="currency"
          />
        </div>

        {/* Filters */}
        <SignalsFilter
          onFilterChange={setFilters}
          assets={uniqueAssets}
        />

        {/* Error Display */}
        {error && (
          <div className="mt-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-semibold">Error:</span>
              <span className="text-red-400">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSignals()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Signals Display */}
        <div className="mt-8">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Signals</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {signals.length} of {metrics.totalSignals}
                </span>
                <div className="flex gap-1 ml-4">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {viewMode === 'table' ? (
              <SignalsTable signals={signals} isLoading={isLoading} />
            ) : (
              <div className="p-4">
                <SignalsGrid signals={signals} isLoading={isLoading} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Dashboard automatically refreshes every {refreshInterval} seconds
          </p>
          <p className="mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </main>
  );
}
