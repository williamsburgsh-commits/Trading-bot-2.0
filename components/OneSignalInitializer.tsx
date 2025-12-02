'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignal?: {
      init: (config: OneSignalConfig) => void;
      showSlidedownPrompt: () => void;
    };
  }
}

interface OneSignalConfig {
  appId: string;
  safari_web_id?: string;
  notifyButton?: {
    enable: boolean;
  };
  allowLocalhostAsSecureOrigin?: boolean;
  serviceWorkerParam?: {
    scope: string;
  };
  serviceWorkerPath?: string;
}

export function OneSignalInitializer() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId) {
      console.warn('OneSignal App ID not configured. Push notifications disabled.');
      return;
    }

    const initOneSignal = () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        window.OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
          notifyButton: {
            enable: true,
          },
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        });

        window.OneSignal.showSlidedownPrompt();
      }
    };

    if (document.readyState === 'complete') {
      initOneSignal();
    } else {
      window.addEventListener('load', initOneSignal);
      return () => window.removeEventListener('load', initOneSignal);
    }
  }, []);

  return null;
}
