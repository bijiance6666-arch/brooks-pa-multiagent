/**
 * Brooks PA Multi-Agent Trading Framework
 * Entry point
 */

const { BrooksPAWorkflow } = require('./framework/workflow');

/**
 * Example market data — replace with your data source
 */
const exampleMarketData = {
  // M30 bars (last 20 candles)
  m30Bars: Array.from({ length: 20 }, (_, i) => {
    const base = 3240 + (i - 10) * 0.8;
    const volatility = 2.5;
    const trendBias = i > 10 ? 2 : -1;
    return {
      open: base + (Math.random() - 0.5) * volatility,
      high: base + volatility + Math.random() * volatility + trendBias,
      low: base - volatility * 0.5 + trendBias,
      close: base + (Math.random() - 0.3) * volatility + trendBias,
      time: new Date(Date.now() - (20 - i) * 30 * 60 * 1000).toISOString(),
    };
  }),

  // Current M5 bar
  m5Bar: {
    open: 3242.5,
    high: 3245.2,
    low: 3241.0,
    close: 3244.8,
  },

  // Current price
  currentPrice: 3244.8,

  // EMA(50) on M30
  ema: 3238.5,

  // Recent swing highs and lows
  recentHighs: [3255.0, 3248.2, 3245.5],
  recentLows: [3220.0, 3228.5, 3235.0],

  // Meta
  pair: 'XAUUSD',
  timeframe: 'M5',
  timestamp: new Date().toISOString(),
};

// Run the workflow
async function main() {
  console.log('Brooks PA Multi-Agent Trading Framework');
  console.log('=====================================\n');

  const workflow = new BrooksPAWorkflow({ verbose: true });
  const result = await workflow.run(exampleMarketData);

  console.log('\n--- Final Summary ---');
  console.log(`Action:   ${result.summary.action}`);
  console.log(`Direction: ${result.summary.direction}`);
  console.log(`Market:   ${result.summary.marketType}`);
  console.log(`Quality:  ${result.summary.qualityScore}/10`);
  console.log(`Reason:   ${result.summary.reason}`);
}

main().catch(console.error);
