'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserSettings, Asset } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const { data: settingsData, mutate: mutateSettings } = useSWR<{ settings: UserSettings }>(
    isAuthenticated ? '/api/settings' : null,
    fetcher
  );

  const { data: assetsData } = useSWR<{ assets: Asset[] }>(
    isAuthenticated ? '/api/assets' : null,
    fetcher
  );

  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('authToken');
        })
        .finally(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('An error occurred during login');
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (data.success) {
        setSaveSuccess(true);
        mutateSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAsset = (symbol: string) => {
    if (!settings) return;

    const enabledAssets = settings.enabledAssets.includes(symbol)
      ? settings.enabledAssets.filter((a) => a !== symbol)
      : [...settings.enabledAssets, symbol];

    setSettings({ ...settings, enabledAssets });
  };

  const toggleTimeframe = (timeframe: string) => {
    if (!settings) return;

    const preferredTimeframes = settings.preferredTimeframes.includes(timeframe)
      ? settings.preferredTimeframes.filter((t) => t !== timeframe)
      : [...settings.preferredTimeframes, timeframe];

    setSettings({ ...settings, preferredTimeframes });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-6">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please log in to access settings.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
              {loginError && <div className="text-sm text-destructive">{loginError}</div>}
              <Button type="submit" className="w-full">
                Login
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Demo credentials: admin / admin123
              </p>
            </form>
            <div className="mt-6">
              <Link href="/">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings || !assetsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cryptoAssets = assetsData.assets.filter((a) => a.type === 'crypto');
  const forexAssets = assetsData.assets.filter((a) => a.type === 'forex');
  const timeframes = ['5m', '15m', '30m', '1h', '4h', '1d'];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Customize your trading signal preferences
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Preferences</h2>

            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Cryptocurrency Assets</h3>
              <div className="space-y-3">
                {cryptoAssets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                  >
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                    <Switch
                      checked={settings.enabledAssets.includes(asset.symbol)}
                      onCheckedChange={() => toggleAsset(asset.symbol)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Forex Assets</h3>
              <div className="space-y-3">
                {forexAssets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                  >
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                    <Switch
                      checked={settings.enabledAssets.includes(asset.symbol)}
                      onCheckedChange={() => toggleAsset(asset.symbol)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Channels</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive signal alerts via email
                  </div>
                </div>
                <Switch
                  checked={settings.notificationChannels.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationChannels: {
                        ...settings.notificationChannels,
                        email: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive instant push notifications
                  </div>
                </div>
                <Switch
                  checked={settings.notificationChannels.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationChannels: {
                        ...settings.notificationChannels,
                        push: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <div className="font-medium">Webhook Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Send signals to external webhook
                  </div>
                </div>
                <Switch
                  checked={settings.notificationChannels.webhook}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationChannels: {
                        ...settings.notificationChannels,
                        webhook: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Preferred Timeframes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select which timeframes you want to receive signals for
            </p>
            <div className="grid grid-cols-3 gap-3">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => toggleTimeframe(timeframe)}
                  className={`p-3 rounded-md border transition-colors ${
                    settings.preferredTimeframes.includes(timeframe)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Level</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Adjust your risk tolerance (affects position sizing and stop loss distances)
            </p>
            <div className="space-y-4">
              <Slider
                value={[settings.riskLevel]}
                onValueChange={(value) => setSettings({ ...settings, riskLevel: value[0] })}
                min={0}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Conservative (0%)</span>
                <span className="font-medium text-foreground">Current: {settings.riskLevel}%</span>
                <span>Aggressive (100%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>

            {saveSuccess && (
              <span className="text-sm text-green-500 font-medium">
                Settings saved successfully!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
