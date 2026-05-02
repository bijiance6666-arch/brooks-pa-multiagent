/**
 * Scenario 2: Trend Reversal — Pullback Entry
 *
 * Situation: M30 is in a clear uptrend. Price pulls back to
 * a prior support level (demand zone). M5 shows a hammer bar.
 * This is a high-probability pullback long setup.
 *
 * Key teaching: Trade pullbacks in the direction of the trend.
 * The entry bar (hammer) gives us the signal.
 */

const { BrooksPAWorkflow } = require('../framework/workflow');

const marketData = {
  // Strong uptrend on M30 — price consistently above EMA
  m30Bars: [
    { open: 3200, high: 3210, low: 3195, close: 3208 },
    { open: 3208, high: 3220, low: 3205, close: 3218 },
    { open: 3218, high: 3230, low: 3215, close: 3228 },
    { open: 3228, high: 3240, low: 3225, close: 3238 },
    { open: 3238, high: 3248, low: 3235, close: 3245 }, // Pullback starts
    { open: 3245, high: 3250, low: 3238, close: 3240 },
    { open: 3240, high: 3246, low: 3230, close: 3232 },
    { open: 3232, high: 3238, low: 3225, close: 3228 }, // Deep pullback to 3230
    { open: 3228, high: 3235, low: 3222, close: 3230 },
    { open: 3230, high: 3236, low: 3225, close: 3235 },
    { open: 3235, high: 3240, low: 3232, close: 3238 },
    { open: 3238, high: 3242, low: 3235, close: 3240 }, // Recovery
    { open: 3240, high: 3248, low: 3238, close: 3245 },
    { open: 3245, high: 3250, low: 3242, close: 3248 },
    { open: 3248, high: 3252, low: 3246, close: 3250 },
    { open: 3250, high: 3255, low: 3248, close: 3252 }, // EMA still rising
  ],
  // Hammer bar at the pullback low — the signal bar
  m5Bar: {
    open: 3230,
    high: 3238,  // Upper wick = sellers rejected
    low: 3228,   // Tested demand zone
    close: 3237, // Closed near high = reversal signal
  },
  currentPrice: 3237,
  ema: 3230, // EMA below price — uptrend intact
  recentHighs: [3255, 3250, 3248],
  recentLows: [3225, 3228, 3230], // 3230 is the pullback zone
  pair: 'XAUUSD',
  timeframe: 'M5',
};

async function main() {
  console.log('\n==============================================');
  console.log('Scenario 2: Trend Pullback Entry');
  console.log('==============================================');
  console.log('Context: M30 in uptrend. Price pulled back to');
  console.log('         3230 demand zone. M5 shows hammer bar.');
  console.log('         This is a textbook pullback long setup.\n');

  const workflow = new BrooksPAWorkflow({ verbose: true });
  const result = await workflow.run(marketData);

  console.log('\n--- Scenario 2 Analysis ---');
  console.log('EXPECTED: High-quality pullback long setup.');
  console.log('          All 5 conditions should pass.');
  console.log('');
  console.log('Actual Decision:', result.decision.decision);
  console.log('Direction:', result.summary.direction);
  console.log('Quality Score:', result.summary.qualityScore + '/10');
  console.log('Rationale:', result.decision.rationale);
}

main().catch(console.error);
