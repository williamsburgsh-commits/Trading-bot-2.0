export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import type { UserSettings } from '@/lib/types';

const defaultSettings: UserSettings = {
  enabledAssets: ['BTCUSDT', 'ETHUSDT', 'EUR/USD', 'GBP/USD'],
  notificationChannels: {
    email: false,
    push: true,
    webhook: false,
  },
  preferredTimeframes: ['4h', '1d'],
  riskLevel: 50,
};

let settingsStore: UserSettings = { ...defaultSettings };

export async function GET() {
  return Response.json({ settings: settingsStore });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return Response.json({ error: 'Settings object is required' }, { status: 400 });
    }

    settingsStore = {
      ...settingsStore,
      ...settings,
    };

    return Response.json({
      success: true,
      settings: settingsStore,
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return Response.json(
      { error: 'Failed to save settings', message: error.message },
      { status: 500 }
    );
  }
}
