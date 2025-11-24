# Trading Signals Dashboard - Feature Reference

## User Interface

### Main Dashboard Page

```
┌─────────────────────────────────────────────────────────┐
│ Trading Signals Dashboard                               │
│ Real-time monitoring and analytics for trading signals  │
│                                                         │
│ [Auto-refresh ☑] [Interval: 15s ▼] [Refresh ↻]       │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│Active: 15    │Total: 142    │Closed: 127   │Win Rate: 62% │Avg P&L: $125 │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────┐
│ [Status ▼] [Asset ▼] [Type ▼] [Signal ▼] [Clear All]  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Signals (Showing 50 of 142)            [📋] [📊]       │
├───┬──────┬─────┬───────┬─────────┬─────────┬────┬──────┤
│   │Asset │Type │Entry  │SL       │TP1     │... │Status│
├───┼──────┼─────┼───────┼─────────┼─────────┼────┼──────┤
│ ✓ │BTCUSDT│🟢BUY│45000 │44000   │45600   │... │Active│
│ ✓ │ETHUSDT│🔴SELL│2500 │2550    │2400    │... │Active│
│ ✓ │EUR/USD│🟢BUY│1.0850│1.0820  │1.0880  │... │Closed│
└───┴──────┴─────┴───────┴─────────┴─────────┴────┴──────┘
```

## Features by Section

### 1. Metrics Cards (Top Bar)

**Active Signals**
- Shows currently open positions
- Real-time count
- Updated on refresh

**Total Signals**
- All-time signal count
- Includes active, closed, and filled
- Cumulative total

**Closed Signals**
- Count of completed trades
- Used for performance calculation
- Historical data

**Win Rate**
- Percentage of profitable closed signals
- Calculated from closed trades
- Trend indicator (up if > 50%)

**Average Profit/Loss**
- Mean profit/loss per signal
- Currency formatted
- Trend indicator (green/red)

### 2. Filter Bar

**Status Filter**
```
[Status ▼]
├─ Clear Filter
├─ active
├─ filled
└─ closed
```
- Narrows signals by current state
- Combines with other filters
- Shows active filter as badge

**Asset Filter**
```
[Asset ▼]
├─ Clear Filter
├─ BTCUSDT
├─ ETHUSDT
├─ XRPUSDT
├─ SOLUSDT
├─ EUR/USD
├─ USD/JPY
└─ GBP/USD
```
- Select specific cryptocurrency or forex pair
- Dynamically populated from signals
- Shows selected asset

**Type Filter** (Asset Type)
```
[Type ▼]
├─ Clear Filter
├─ crypto
└─ forex
```
- Separates cryptocurrency and forex signals
- Useful for different trading strategies
- Can combine with other filters

**Signal Type Filter**
```
[Signal ▼]
├─ Clear Filter
├─ BUY
└─ SELL
```
- Shows only bullish or bearish signals
- Color coded in results
- Helps directional bias analysis

**Clear All**
- Removes all active filters
- Resets to full signal list
- Only shows when filters active

### 3. Table View (📋 Icon)

**Columns:**
1. **Asset** - Cryptocurrency or forex pair
   - BTCUSDT, ETHUSDT, EUR/USD, etc.

2. **Signal Type** - BUY or SELL
   - 🟢 Green badge = BUY
   - 🔴 Red badge = SELL
   - Icon + Text

3. **Timeframe** - Trading timeframe
   - 5m, 15m, 1h, 4h

4. **Entry** - Market entry price
   - Currency formatted
   - Right-aligned

5. **Stop Loss** - Risk management exit
   - Red text for visibility
   - Right-aligned

6. **TP1 (40%)** - First profit level
   - 40% of position
   - Green text
   - Right-aligned

7. **TP2 (35%)** - Second profit level
   - 35% of position
   - Green text
   - Right-aligned

8. **TP3 (25%)** - Final profit level
   - Remaining 25%
   - Green text
   - Right-aligned

9. **Status** - Signal state
   - 🔵 Blue = Active (open trade)
   - 🟡 Yellow = Filled (partial)
   - ⚫ Gray = Closed (complete)

10. **Created** - Timestamp
    - "5 minutes ago" format
    - Relative to now

**Interaction:**
- Hover rows for highlight
- Responsive on mobile
- Horizontal scroll on small screens

### 4. Grid View (📊 Icon)

**Card Layout:**
```
┌─────────────────────────┐
│ [🟢 BUY]    BTCUSDT     │
│ 1h • crypto      [Active]│
│                          │
│ Entry  45,000.50        │
│ SL     44,000.00 (red)  │
│ ─────────────────────  │
│ TP1    45,600.00 (40%)  │
│ TP2    46,200.00 (35%)  │
│ TP3    46,500.00 (25%)  │
│                          │
│ Risk/Reward: 2.5:1      │
│ Current P&L: +$500      │
│                          │
│ RSI: 28.5  Vol: 1.8x    │
│                          │
│ 5 min ago  10:30 AM     │
└─────────────────────────┘
```

**Card Elements:**
- Header with signal type icon and asset
- Status badge
- Entry price (bold)
- Stop loss (red)
- Take profit levels (green)
- Risk/reward ratio
- Current profit/loss
- Technical indicators
- Time information

**Layout:**
- 1 column on mobile
- 2 columns on tablet
- 3 columns on desktop
- Responsive gap

### 5. Controls (Top Right)

**Auto-Refresh Toggle**
- Checkbox to enable/disable
- Label: "Auto-refresh: ☑"
- Stops polling when unchecked

**Refresh Interval Selector** (when auto-refresh enabled)
- Dropdown menu
- Options: 5s, 10s, 15s, 30s, 1m
- Default: 15s

**Manual Refresh Button**
- 🔄 Refresh button
- Disabled during refresh (loading state)
- Immediate data update
- Shows spinner during loading

### 6. Footer

**Status Information**
- "Dashboard automatically refreshes every 15 seconds"
- "Last updated: 3:45:23 PM"

---

## View Mode Transitions

### Switching Views
- Click 📋 (List) for table view
- Click 📊 (Grid) for grid view
- Current view highlighted
- Data persists between switches

---

## Filtering Examples

### Example 1: All Active BUY Signals
1. Click [Status ▼] → Select "active"
2. Click [Signal ▼] → Select "BUY"
3. Result: Only active BUY signals shown

### Example 2: All Forex Signals
1. Click [Type ▼] → Select "forex"
2. Result: EUR/USD, USD/JPY, GBP/USD signals only

### Example 3: Specific Asset History
1. Click [Asset ▼] → Select "BTCUSDT"
2. Result: All BTCUSDT signals (all statuses)

---

## Color Legend

### Signal Type
- 🟢 **Green** = BUY (bullish, long position)
- 🔴 **Red** = SELL (bearish, short position)

### Signal Status
- 🔵 **Blue Badge** = Active (open, waiting for TP/SL)
- 🟡 **Yellow Badge** = Filled (partially executed)
- ⚫ **Gray Badge** = Closed (trade complete)

### Price Levels
- **Entry**: Black/White (default text)
- **Stop Loss**: 🔴 Red (protection)
- **Take Profit**: 🟢 Green (targets)

### Metrics Trend
- 📈 **Up Arrow** = Positive trend (> 50% for win rate)
- 📉 **Down Arrow** = Negative trend (< 50% for win rate)
- ➡️ **Neutral Arrow** = Average P&L = 0

---

## Keyboard Shortcuts (Future)

*Available in upcoming versions:*
- `R` - Manual refresh
- `T` - Toggle table view
- `G` - Toggle grid view
- `S` - Focus status filter
- `A` - Focus asset filter
- `Esc` - Clear filters
- `?` - Show help

---

## Data Refresh Behavior

### When Auto-Refresh Enabled
1. Fetches /api/signals every N seconds
2. Compares with current data
3. Updates only changed records
4. Preserves scroll position
5. Shows loading indicator

### When Auto-Refresh Disabled
- No automatic updates
- Manual refresh only
- Useful for stable viewing

### Manual Refresh
- Always fetches latest
- Shows spinner during load
- Applies current filters
- Maintains scroll position

---

## Responsive Behavior

### Mobile (< 640px)
- Single column metrics (stack vertically)
- Filters in dropdown or collapsible
- Table scrolls horizontally
- Simplified card view

### Tablet (640px - 1024px)
- 2 column metrics
- Filters in 2 columns
- Table with reduced columns
- 2 column card grid

### Desktop (> 1024px)
- 5 column metrics
- All filters visible
- Full table
- 3+ column card grid

---

## Performance Characteristics

**Initial Load:** ~500ms
**Refresh:** ~200ms
**Filter Apply:** ~50ms
**View Switch:** Instant

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS, Android)

---

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Color contrast WCAG AA compliant
- Alt text on all icons
- ARIA labels on interactive elements
- Focus indicators visible
