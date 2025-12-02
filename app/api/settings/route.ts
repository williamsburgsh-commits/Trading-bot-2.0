export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { UserSettings } from '@/lib/types';
import { z } from 'zod';
import { StorageAdapter } from '@/src/signal-provider/storage/adapter';

const settingsSchema = z.object({
  enabledAssets: z.array(z.string()),
  notificationChannels: z.object({
    email: z.boolean(),
    push: z.boolean(),
    webhook: z.boolean(),
  }),
  preferredTimeframes: z.array(z.string()),
  riskLevel: z.number().min(0).max(100),
});

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

async function getStorageAdapter(): Promise<StorageAdapter> {
  let storageAdapter: StorageAdapter;

  try {
    const { kv } = await import('@/lib/kv');
    storageAdapter = new StorageAdapter(kv);
  } catch {
    storageAdapter = new StorageAdapter();
  }

  await storageAdapter.initialize();
  return storageAdapter;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storageAdapter = await getStorageAdapter();

    const userId = session?.user?.id || 'anonymous';

    const storedSettings = await storageAdapter.getUserSettings(userId);

    const settings = storedSettings
      ? {
          enabledAssets: storedSettings.enabledAssets,
          notificationChannels: storedSettings.notificationChannels,
          preferredTimeframes: storedSettings.preferredTimeframes,
          riskLevel: storedSettings.riskLevel,
        }
      : defaultSettings;

    return Response.json({
      settings,
      authenticated: !!session,
      userId,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return Response.json(
      { error: 'Failed to fetch settings', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    const storageAdapter = await getStorageAdapter();

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return Response.json({ error: 'Settings object is required' }, { status: 400 });
    }

    const validation = settingsSchema.safeParse(settings);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid settings format', details: validation.error.issues },
        { status: 400 }
      );
    }

    await storageAdapter.saveUserSettings({
      userId: session.user.id,
      ...validation.data,
      updatedAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      settings: validation.data,
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return Response.json(
      { error: 'Failed to save settings', message: error.message },
      { status: 500 }
    );
  }
}
