# Push Notifications Guide

## Overview

This trading signal system includes real-time push notifications via OneSignal. When new trading signals are generated and stored in the database, subscribed users automatically receive push notifications on their devices.

## Features

- ✅ **Automatic Notifications**: Fires when new signals are created
- ✅ **Rich Content**: Includes entry price, take profit, stop loss, and timeframe
- ✅ **Duplicate Prevention**: Only sends for unique, non-duplicate signals
- ✅ **User Opt-in**: Respects user notification preferences
- ✅ **Segment Support**: Target specific user groups
- ✅ **Offline Queue**: Notifications queued if user is offline
- ✅ **Cross-Platform**: Works on web, mobile web, and PWAs

## Setup

### 1. Create OneSignal Account

1. Go to https://app.onesignal.com and sign up
2. Click "New App/Website"
3. Enter your app name
4. Select "Web Push" as the platform
5. Click "Next"

### 2. Configure OneSignal

1. **Choose Configuration Type**: Select "Typical Site"
2. **Site URL**: Enter your production URL (e.g., `https://your-app.vercel.app`)
3. **Auto Resubscribe**: Enable (recommended)
4. **Default Notification Icon**: Upload a 256x256 PNG icon (optional)
5. **Permission Prompt Setup**: Choose "Slide Prompt" (default)
6. Click "Save"

### 3. Get Your Credentials

1. Navigate to **Settings → Keys & IDs**
2. Copy your **App ID**
3. Navigate to **Settings → Keys & IDs → REST API Key**
4. Copy your **REST API Key** (keep this secret!)

### 4. Configure Environment Variables

#### Local Development (.env)

```env
# OneSignal Push Notifications
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key-here
ONESIGNAL_ENABLED=true

# Frontend OneSignal (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id-here
```

#### Vercel Production

Add these variables in your Vercel project settings:

1. Go to your Vercel project
2. Navigate to **Settings → Environment Variables**
3. Add each variable:
   - `ONESIGNAL_APP_ID` → Your App ID
   - `ONESIGNAL_REST_API_KEY` → Your REST API Key
   - `ONESIGNAL_ENABLED` → `true`
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID` → Your App ID
4. **Important**: Select "Production", "Preview", and "Development" for all variables
5. Click "Save"

### 5. Deploy

```bash
# Commit your changes
git add .
git commit -m "Add OneSignal push notifications"
git push

# Vercel will automatically deploy
```

## Usage

### Backend: Sending Notifications

Notifications are sent automatically when signals are saved via `DatabaseService`:

```typescript
import { DatabaseService } from './services/database';
import { createOneSignalService } from '../lib/notifications/oneSignal';

const notificationService = createOneSignalService();
const db = new DatabaseService(notificationService);

// When you save a signal, notification is sent automatically
const signal = {
  asset: 'BTCUSDT',
  signalType: 'BUY',
  entryPrice: 50000,
  takeProfit: 52000,
  stopLoss: 48000,
  timeframe: '1h',
  status: 'active',
  metadata: JSON.stringify({ rsi: 35 }),
};

await db.saveSignal(signal);
// Notification sent automatically to all subscribed users!
```

### Manual Notification Sending

You can also send notifications manually:

```typescript
import { createOneSignalService } from '../lib/notifications/oneSignal';

const notificationService = createOneSignalService();

// Send to all subscribed users
await notificationService.sendSignalAlert({
  asset: 'ETHUSDT',
  signalType: 'SELL',
  entryPrice: 3000,
  takeProfit: 2850,
  stopLoss: 3150,
  timeframe: '4h',
});

// Send to specific user
await notificationService.sendSignalAlert(signalData, 'user-id-123');

// Send to a segment
await notificationService.sendToSegment(
  'Premium Users',
  'Market Alert',
  'High volatility detected in BTC/USDT'
);
```

### Frontend: User Subscription

The frontend automatically handles user subscription:

1. **First Visit**: User sees notification permission prompt
2. **Allow**: User subscribed to all notifications
3. **Block**: User won't receive notifications
4. **Later**: User can change preference in browser settings

The OneSignal SDK is automatically initialized in `app/layout.tsx`:

```tsx
import { OneSignalInitializer } from '../components/OneSignalInitializer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OneSignalInitializer />
        {children}
      </body>
    </html>
  );
}
```

## Testing

### Test Notifications Locally

1. **Start the dashboard**:
   ```bash
   npm run dev
   ```

2. **Allow notifications** when prompted in browser

3. **Generate a test signal**:
   ```bash
   npm run test:signals
   ```

4. **Check for notification**: You should receive a push notification!

### Test in Browser Console

```javascript
// Check if OneSignal is loaded
console.log(window.OneSignal);

// Check subscription status
OneSignal.push(function() {
  OneSignal.getUserId(function(userId) {
    console.log('OneSignal User ID:', userId);
  });
  
  OneSignal.isPushNotificationsEnabled(function(isEnabled) {
    console.log('Push notifications enabled:', isEnabled);
  });
});
```

### Test Notification Sending (Backend)

Create a test script:

```typescript
// test-notification.ts
import 'dotenv/config';
import { createOneSignalService } from './lib/notifications/oneSignal';

async function testNotification() {
  const service = createOneSignalService();
  
  if (!service) {
    console.error('OneSignal not configured');
    return;
  }
  
  const result = await service.sendSignalAlert({
    asset: 'TEST',
    signalType: 'BUY',
    entryPrice: 100,
    takeProfit: 105,
    stopLoss: 95,
    timeframe: '1h',
  });
  
  console.log('Notification sent:', result);
}

testNotification();
```

Run it:
```bash
npx ts-node test-notification.ts
```

## Notification Content

### Signal Notifications

**Heading**: 🔔 BUY Signal: BTCUSDT

**Content**:
```
BUY BTCUSDT @ 50000
TP: 52000
SL: 48000
Timeframe: 1h
```

**Data** (for custom handling):
```json
{
  "type": "trading_signal",
  "asset": "BTCUSDT",
  "signalType": "BUY",
  "entryPrice": 50000,
  "takeProfit": 52000,
  "stopLoss": 48000,
  "timeframe": "1h",
  "metadata": {
    "rsi": 35,
    "confidence": 0.85
  }
}
```

## Advanced Features

### User Segmentation

Target specific user groups:

```typescript
// Create segments in OneSignal dashboard
// Then send to specific segments
await notificationService.sendToSegment(
  'Premium Users',
  'Exclusive Signal',
  'VIP signal detected for BTCUSDT',
  { type: 'premium_signal' }
);
```

### Notification Scheduling

OneSignal supports scheduled notifications via their API:

```typescript
// Schedule notification for later
await notificationService.client.post('/notifications', {
  app_id: notificationService.appId,
  headings: { en: 'Scheduled Alert' },
  contents: { en: 'Market opens in 1 hour' },
  send_after: 'Thu Jun 24 2024 14:00:00 GMT-0700',
  included_segments: ['Subscribed Users'],
});
```

### Custom Notification Icons

Add custom icons in OneSignal dashboard:

1. **Settings → Appearance**
2. **Default Notification Icon**: Upload 256x256 PNG
3. **Badge Icon**: Upload 96x96 monochrome PNG
4. **Save**

## Troubleshooting

### Notifications Not Appearing

**Issue**: Users not receiving notifications

**Solutions**:
1. Check browser notification permissions (must be "Allow")
2. Verify `NEXT_PUBLIC_ONESIGNAL_APP_ID` is set correctly
3. Check OneSignal dashboard for delivery status
4. Ensure HTTPS is enabled (required for push notifications)
5. Check browser console for errors

### Service Worker Errors

**Issue**: Service worker registration fails

**Solutions**:
1. Check that `/OneSignalSDKWorker.js` exists in `public/`
2. Verify service worker scope is correct
3. Clear browser cache and reload
4. Check for conflicting service workers

### Backend Notifications Not Sending

**Issue**: `sendSignalAlert` returns false

**Solutions**:
1. Verify `ONESIGNAL_REST_API_KEY` is correct
2. Check for API errors in console logs
3. Ensure network connectivity
4. Verify OneSignal app is active (not paused)
5. Check OneSignal delivery logs in dashboard

### HTTPS Required Error

**Issue**: Push notifications require HTTPS

**Solutions**:
- **Development**: Set `allowLocalhostAsSecureOrigin: true` (already configured)
- **Production**: Use Vercel or another HTTPS-enabled host
- **Local Testing**: Use `ngrok` or similar tunnel service

### Duplicate Notifications

**Issue**: Users receive multiple notifications for same signal

**Root Cause**: Duplicate signal detection not working

**Solutions**:
1. Check `findDuplicateSignal` logic in `DatabaseService`
2. Verify time/price thresholds are appropriate
3. Check that signal metadata matches expected format
4. Ensure duplicate detection runs before `saveSignal`

## Security Best Practices

1. **Keep REST API Key Secret**: Never expose in frontend code
2. **Use Environment Variables**: Store all credentials in `.env`
3. **Validate User Input**: Sanitize signal data before sending
4. **Rate Limiting**: Implement notification rate limits if needed
5. **User Opt-out**: Respect unsubscribe requests
6. **HTTPS Only**: Always use HTTPS in production

## Performance Considerations

1. **Async Notification Sending**: Notifications sent asynchronously (non-blocking)
2. **Error Handling**: Failed notifications logged but don't stop signal saving
3. **Rate Limits**: OneSignal free tier: 10,000 notifications/month
4. **Batch Sending**: Use segments for bulk notifications
5. **Caching**: Service workers cache notification assets

## OneSignal Dashboard

Access your OneSignal dashboard at https://app.onesignal.com for:

- 📊 **Delivery Analytics**: See sent, delivered, and clicked notifications
- 👥 **Audience**: View subscribed users and segments
- 📝 **Message History**: Review all sent notifications
- ⚙️ **Settings**: Configure app settings and credentials
- 🧪 **Testing**: Send test notifications to specific users

## Resources

- **OneSignal Docs**: https://documentation.onesignal.com/docs
- **Web Push Setup**: https://documentation.onesignal.com/docs/web-push-quickstart
- **API Reference**: https://documentation.onesignal.com/reference
- **SDK Reference**: https://documentation.onesignal.com/docs/web-push-sdk

## Cost

- **Free Tier**: Up to 10,000 notifications/month
- **Growth Plan**: $9/month for 100,000 notifications
- **Professional Plan**: Custom pricing for high volume

See https://onesignal.com/pricing for current pricing.

## Support

For issues with this implementation:
1. Check this documentation
2. Review console logs for errors
3. Check OneSignal dashboard delivery logs
4. Consult OneSignal documentation

For OneSignal-specific issues:
- **Support**: https://onesignal.com/support
- **Community**: https://onesignal.com/community
