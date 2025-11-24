import 'dotenv/config';
import { MarketDataService } from '../services/marketData';
import { computeIndicators, computeMultiTimeframeIndicators } from '../modules/technical-analysis';

async function basicExample() {
  console.log('\n=== Basic Indicator Computation Example ===\n');

  const marketData = new MarketDataService();

  try {
    const klines = await marketData.getKlines('BTCUSDT', '1h', 250);
    const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

    if (snapshot) {
      console.log(`Asset: ${snapshot.asset}`);
      console.log(`Timeframe: ${snapshot.timeframe}`);
      console.log(`Price: $${snapshot.price.toFixed(2)}`);
      console.log(`Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
      console.log('\n--- RSI ---');
      console.log(`Value: ${snapshot.rsi.value.toFixed(2)}`);
      console.log(`Overbought: ${snapshot.rsi.overbought}`);
      console.log(`Oversold: ${snapshot.rsi.oversold}`);

      console.log('\n--- MACD ---');
      console.log(`MACD: ${snapshot.macd.macd.toFixed(2)}`);
      console.log(`Signal: ${snapshot.macd.signal.toFixed(2)}`);
      console.log(`Histogram: ${snapshot.macd.histogram.toFixed(2)}`);
      console.log(`Bullish: ${snapshot.macd.bullish}`);
      console.log(`Bearish: ${snapshot.macd.bearish}`);

      console.log('\n--- Bollinger Bands ---');
      console.log(`Upper: $${snapshot.bollingerBands.upper.toFixed(2)}`);
      console.log(`Middle: $${snapshot.bollingerBands.middle.toFixed(2)}`);
      console.log(`Lower: $${snapshot.bollingerBands.lower.toFixed(2)}`);
      console.log(`Bandwidth: ${(snapshot.bollingerBands.bandwidth * 100).toFixed(2)}%`);
      console.log(`%B: ${snapshot.bollingerBands.percentB.toFixed(2)}`);

      console.log('\n--- Moving Averages ---');
      for (const period in snapshot.sma) {
        console.log(`SMA ${period}: $${snapshot.sma[period]!.value.toFixed(2)}`);
      }

      console.log('\n--- Exponential Moving Averages ---');
      for (const period in snapshot.ema) {
        console.log(`EMA ${period}: $${snapshot.ema[period]!.value.toFixed(2)}`);
      }

      console.log('\n--- ATR ---');
      console.log(`Value: $${snapshot.atr.value.toFixed(2)}`);
      console.log(`Period: ${snapshot.atr.period}`);

      console.log('\n--- Volume ---');
      console.log(`Current: ${snapshot.volume.current.toFixed(2)}`);
      console.log(`Average: ${snapshot.volume.average.toFixed(2)}`);
      console.log(`Ratio: ${snapshot.volume.ratio.toFixed(2)}x`);
    } else {
      console.log('Failed to compute indicators (insufficient data)');
    }
  } catch (error) {
    console.error('Error in basic example:', error);
  }
}

async function customConfigExample() {
  console.log('\n=== Custom Configuration Example ===\n');

  const marketData = new MarketDataService();

  try {
    const klines = await marketData.getKlines('ETHUSDT', '4h', 250);

    const customConfig = {
      rsi: {
        period: 21,
        overbought: 75,
        oversold: 25,
      },
      macd: {
        fast: 8,
        slow: 21,
        signal: 5,
      },
      bollingerBands: {
        period: 30,
        stdDev: 2.5,
      },
      sma: {
        periods: [20, 50, 200],
      },
      ema: {
        periods: [12, 26, 50],
      },
      atr: {
        period: 20,
      },
      volume: {
        period: 30,
      },
    };

    const snapshot = computeIndicators(klines, 'ETHUSDT', '4h', customConfig);

    if (snapshot) {
      console.log(`Asset: ${snapshot.asset}`);
      console.log(`Timeframe: ${snapshot.timeframe}`);
      console.log(`RSI (${snapshot.rsi.period}): ${snapshot.rsi.value.toFixed(2)}`);
      console.log(
        `MACD (${snapshot.macd.fastPeriod}/${snapshot.macd.slowPeriod}/${snapshot.macd.signalPeriod}): ${snapshot.macd.histogram.toFixed(2)}`
      );
      console.log(
        `BB (${snapshot.bollingerBands.period}, ${snapshot.bollingerBands.stdDev}σ): %B = ${snapshot.bollingerBands.percentB.toFixed(2)}`
      );

      console.log('\nCustom SMA Periods:');
      for (const period in snapshot.sma) {
        console.log(`  SMA ${period}: $${snapshot.sma[period]!.value.toFixed(2)}`);
      }

      console.log('\nCustom EMA Periods:');
      for (const period in snapshot.ema) {
        console.log(`  EMA ${period}: $${snapshot.ema[period]!.value.toFixed(2)}`);
      }
    }
  } catch (error) {
    console.error('Error in custom config example:', error);
  }
}

async function multiTimeframeExample() {
  console.log('\n=== Multi-Timeframe Analysis Example ===\n');

  const marketData = new MarketDataService();
  const asset = 'BTCUSDT';

  try {
    console.log(`Fetching data for ${asset} across multiple timeframes...`);

    const timeframes = ['15m', '1h', '4h'];
    const klinesByTimeframe = new Map();

    for (const tf of timeframes) {
      const klines = await marketData.getKlines(asset, tf, 250);
      klinesByTimeframe.set(tf, klines);
      console.log(`  Fetched ${klines.length} candles for ${tf}`);
    }

    const multiTF = computeMultiTimeframeIndicators(klinesByTimeframe, asset);

    console.log('\n--- Multi-Timeframe Indicators ---\n');

    for (const tf of timeframes) {
      const key = `${asset}_${tf}`;
      const snapshot = multiTF[key];

      if (snapshot) {
        console.log(`${tf} Timeframe:`);
        console.log(`  Price: $${snapshot.price.toFixed(2)}`);
        console.log(
          `  RSI: ${snapshot.rsi.value.toFixed(2)} ${snapshot.rsi.overbought ? '(Overbought)' : snapshot.rsi.oversold ? '(Oversold)' : ''}`
        );
        console.log(
          `  MACD: ${snapshot.macd.histogram.toFixed(2)} ${snapshot.macd.bullish ? '(Bullish)' : snapshot.macd.bearish ? '(Bearish)' : ''}`
        );
        console.log(`  BB %B: ${snapshot.bollingerBands.percentB.toFixed(2)}`);
        console.log(`  Volume Ratio: ${snapshot.volume.ratio.toFixed(2)}x`);
        console.log('');
      }
    }

    console.log('--- Trend Alignment Analysis ---\n');

    const allBullish = timeframes.every((tf) => {
      const snapshot = multiTF[`${asset}_${tf}`];
      return snapshot && snapshot.macd.bullish && snapshot.rsi.value > 50;
    });

    const allBearish = timeframes.every((tf) => {
      const snapshot = multiTF[`${asset}_${tf}`];
      return snapshot && snapshot.macd.bearish && snapshot.rsi.value < 50;
    });

    if (allBullish) {
      console.log('✓ All timeframes showing BULLISH alignment');
    } else if (allBearish) {
      console.log('✓ All timeframes showing BEARISH alignment');
    } else {
      console.log('⚠ Mixed signals across timeframes');
    }
  } catch (error) {
    console.error('Error in multi-timeframe example:', error);
  }
}

async function signalDetectionExample() {
  console.log('\n=== Signal Detection Example ===\n');

  const marketData = new MarketDataService();

  try {
    const klines = await marketData.getKlines('BTCUSDT', '1h', 250);
    const snapshot = computeIndicators(klines, 'BTCUSDT', '1h');

    if (snapshot) {
      console.log(`Analyzing ${snapshot.asset} on ${snapshot.timeframe}`);
      console.log(`Price: $${snapshot.price.toFixed(2)}\n`);

      const signals: string[] = [];

      if (snapshot.rsi.oversold) {
        signals.push('RSI Oversold - Potential BUY signal');
      } else if (snapshot.rsi.overbought) {
        signals.push('RSI Overbought - Potential SELL signal');
      }

      if (snapshot.macd.bullish) {
        signals.push('MACD Bullish Crossover - BUY signal');
      } else if (snapshot.macd.bearish) {
        signals.push('MACD Bearish Crossover - SELL signal');
      }

      if (snapshot.bollingerBands.percentB < 0.2) {
        signals.push('Price near Lower Bollinger Band - Potential BUY');
      } else if (snapshot.bollingerBands.percentB > 0.8) {
        signals.push('Price near Upper Bollinger Band - Potential SELL');
      }

      if (snapshot.volume.ratio > 1.5) {
        signals.push(`High Volume (${snapshot.volume.ratio.toFixed(2)}x avg) - Strong momentum`);
      }

      const ema20 = snapshot.ema[20];
      const ema50 = snapshot.ema[50];
      if (ema20 && ema50) {
        if (ema20.value > ema50.value) {
          signals.push('EMA 20 > EMA 50 - Bullish trend');
        } else {
          signals.push('EMA 20 < EMA 50 - Bearish trend');
        }
      }

      if (signals.length > 0) {
        console.log('Detected Signals:');
        signals.forEach((signal, i) => {
          console.log(`  ${i + 1}. ${signal}`);
        });
      } else {
        console.log('No clear signals detected');
      }

      console.log('\nRisk Management:');
      const atrStop = snapshot.atr.value * 2;
      console.log(`  Suggested Stop Loss: ±$${atrStop.toFixed(2)} (2x ATR)`);
      console.log(
        `  BB Width: ${(snapshot.bollingerBands.bandwidth * 100).toFixed(2)}% (Volatility)`
      );
    }
  } catch (error) {
    console.error('Error in signal detection example:', error);
  }
}

async function main() {
  console.log('Technical Analysis Module Examples');
  console.log('==================================');

  await basicExample();
  await customConfigExample();
  await multiTimeframeExample();
  await signalDetectionExample();

  console.log('\n=== Examples Complete ===\n');
}

main().catch(console.error);
