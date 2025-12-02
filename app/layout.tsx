import type { Metadata } from 'next';
import { Providers } from './providers';
import { OneSignalInitializer } from '../components/OneSignalInitializer';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import { OfflineIndicator } from '../components/OfflineIndicator';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trading Signals Dashboard',
  description: 'Real-time trading signals monitoring and analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async></script>
      </head>
      <body>
        <Providers>
          <OneSignalInitializer />
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
