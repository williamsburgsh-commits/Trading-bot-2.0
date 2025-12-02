export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Asset } from '@/lib/types';

export async function GET() {
  const assets: Asset[] = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', enabled: true },
    { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', enabled: true },
    { symbol: 'XRPUSDT', name: 'Ripple', type: 'crypto', enabled: true },
    { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', enabled: true },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', enabled: true },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', enabled: true },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', enabled: true },
  ];

  return Response.json({ assets });
}
