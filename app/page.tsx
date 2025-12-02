'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Settings, TrendingUp, TrendingDown, Activity, Target, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SignalsTable } from '@/components/signals-table';
import { SignalsTableSkeleton } from '@/components/signals-table-skeleton';
import { RiskDisclaimer } from '@/components/risk-disclaimer';
import { Button } from '@/components/ui/button';
import type { SignalsResponse } from '@/lib/types';
import { formatPercent } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'daily' | 'scalping'>('daily');
  const [assetFilter, setAssetFilter] = useState<string>('');

  const queryParams = new URLSearchParams();
  queryParams.set('type', activeTab);
  if (assetFilter) {
    queryParams.set('asset', assetFilter);
  }

  const { data, error, isLoading, mutate } = useSWR<SignalsResponse>(
    `/api/signals?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const signals = data?.signals || [];
  const metrics = data?.metrics;

  const availableAssets = Array.from(new Set(signals.map((s) => s.asset)));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trading Signals Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Real-time signals with automatic updates every 15 seconds
              </p>
            </div>
            <Link href="/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <RiskDisclaimer />

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Signals</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.activeSignals}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Signals</span>
                <Target className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.totalSignals}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Closed Signals</span>
                <AlertCircle className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.closedSignals}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">
                {formatPercent(metrics.winRate)}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Profit</span>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </div>
              <div
                className={`text-2xl font-bold ${metrics.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {formatPercent(metrics.avgProfit)}
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'scalping')}>
              <TabsList>
                <TabsTrigger value="daily">Daily Signals</TabsTrigger>
                <TabsTrigger value="scalping">Scalping Signals</TabsTrigger>
              </TabsList>
            </Tabs>

            {availableAssets.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Filter by Asset:</label>
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-input rounded-md bg-background"
                >
                  <option value="">All Assets</option>
                  {availableAssets.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-4">
              <p className="font-semibold">Error loading signals</p>
              <p className="text-sm mt-1">{error.message || 'Failed to fetch signals'}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          )}

          {isLoading ? <SignalsTableSkeleton /> : <SignalsTable signals={signals} />}

          {!isLoading && !error && signals.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No signals available</p>
              <p className="text-sm mt-1">
                {activeTab === 'daily'
                  ? 'Daily signals will appear here when generated'
                  : 'Scalping signals will appear here when generated'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Data refreshes automatically every 15 seconds</p>
        </div>
      </div>
    </div>
  );
}
