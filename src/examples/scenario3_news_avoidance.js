/**
 * Scenario 3: Counter-Trend Trap Avoidance
 *
 * Situation: Price made a lower high on M5. The trader is
 * tempted to short because "it looks like a reversal."
 * But M30 is still strongly bullish.
 *
 * Key teaching: Do not counter-trend. The Supervisor's
 * Condition 1 (market background) should block this trade.
 * This scenario demonstrates the most common beginner mistake.
 */

const { BrooksPAWorkflow } = require('../framework/workflow');

const marketData = {
  // M30 still in strong uptrend
  m30Bars: [
    { open: 3200, high: 3210, low: 3195, close: 3208 },
    { open: 3208, high: 3220, low: 3205, close: 3218 },
    { open: 3218, high: 3230, low: 3215, close: 3228 },
    { open: 3228, high: 3240, low: 3225, close: 3238 },
    { open: 3238, high: 3250, low: 3235, close: 3248 },
    { open: 3248, high: 3255, low: 3242, close: 3252 },
    { open: 3252, high: 3258, low: 3250, close: 3255 },
    { open: 3255, high: 3260, low: 3252, close: 3258 },
    { open: 3258, high: 3262, low: 3255, close: 3260 },
    { open: 3260, high: 3263, low: 3258, close: 3261 },
    // Pullback bar — NOT a reversal signal
    { open: 3261, high: 3263, low: 3255, close: 3257 },
    { open: 3257, high: 3260, low: 3255, close: 3258 },
    { open: 3258, high: 3261, low: 3256, close: 3259 },
    { open: 3259, high: 3260, low: 3257, close: 3258 },
    { open: 3258, high: 3260, low: 3257, close: 3258 },
    { open: 3258, high: 3260, low: 3256, close: 3257 },
  ],
  // Small bearish bar — NOT a valid signal bar
  m5Bar: {
    open: 3259,
    high: 3260,
    low: 3257,
    close: 3258, // Only 1 pip down — not a real signal
  },
  currentPrice: 3258,
  ema: 3240, // Price well above EMA — uptrend intact
  recentHighs: [3263, 3262, 3260],
  recentLows: [3255, 3256, 3257],
  pair: 'XAUUSD',
  timeframe: 'M5',
};

async function main() {
  console.log('\n==============================================');
  console.log('Scenario 3: Counter-Trend Trap Avoidance');
  console.log('==============================================');
  console.log('Context: Price made a lower high on M5. Trader');
  console.log('         tempted to short. But M30 is bullish.');
  console.log('         This is a counter-trend trap.\n');

  const workflow = new BrooksPAWorkflow({ verbose: true });
  const result = await workflow.run(marketData);

  console.log('\n--- Scenario 3 Analysis ---');
  console.log('EXPECTED: Supervisor blocks — wrong market background.');
  console.log('          Decision: PASS or WAIT.');
  console.log('');
  console.log('Actual Decision:', result.decision.decision);
  console.log('Market Type:', result.summary.marketType);
  console.log('Rationale:', result.decision.rationale);

  // Check which conditions failed
  const failedConditions = result.supervisor?.conditionsUnmet || [];
  if (failedConditions.length > 0) {
    console.log('\nFailed conditions:');
    failedConditions.forEach(c => console.log('  -', c));
  }
}

main().catch(console.error);
