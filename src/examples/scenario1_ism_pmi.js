/**
 * Scenario 1: ISM PMI News Release
 *
 * Situation: ISM PMI data is about to be released.
 * Pre-news: Market is in a trading range around 4565.
 *
 * Key teaching: Do not enter new positions right before major news.
 * The framework's Supervisor should block any new entries.
 */

const { BrooksPAWorkflow } = require('../framework/workflow');

// Simulated market state just before PMI release
const marketData = {
  m30Bars: [
    // EMA flat, range-bound market
    { open: 4560, high: 4568, low: 4558, close: 4565 },
    { open: 4565, high: 4569, low: 4560, close: 4562 },
    { open: 4562, high: 4568, low: 4561, close: 4566 },
    { open: 4566, high: 4570, low: 4562, close: 4564 },
    { open: 4564, high: 4568, low: 4558, close: 4560 },
    { open: 4560, high: 4567, low: 4557, close: 4563 },
    { open: 4563, high: 4568, low: 4560, close: 4565 },
    { open: 4565, high: 4570, low: 4563, close: 4567 },
    { open: 4567, high: 4572, low: 4565, close: 4570 },
    { open: 4570, high: 4575, low: 4566, close: 4568 },
    { open: 4568, high: 4571, low: 4565, close: 4566 },
    { open: 4566, high: 4570, low: 4564, close: 4567 },
    { open: 4567, high: 4572, low: 4565, close: 4570 },
    { open: 4570, high: 4573, low: 4568, close: 4569 },
    { open: 4569, high: 4572, low: 4567, close: 4570 },
    { open: 4570, high: 4571, low: 4568, close: 4568 }, // EMA flat
  ],
  m5Bar: {
    open: 4568,
    high: 4570,
    low: 4567,
    close: 4569,
  },
  currentPrice: 4569,
  ema: 4569, // EMA completely flat
  recentHighs: [4575, 4572, 4570],
  recentLows: [4557, 4560, 4562],
  // News context — this is key context that supervisor should check
  newsEvent: {
    name: 'ISM Manufacturing PMI',
    scheduledTime: new Date().toISOString(),
    previous: 52.7,
    forecast: 53.0,
    unit: 'pts',
  },
  pair: 'XAUUSD',
  timeframe: 'M5',
};

async function main() {
  console.log('\n==============================================');
  console.log('Scenario 1: ISM PMI — News Release Risk');
  console.log('==============================================');
  console.log('Context: Market is in a tight range. PMI data');
  console.log('         is about to be released. Do we enter?\n');

  const workflow = new BrooksPAWorkflow({ verbose: true });
  const result = await workflow.run(marketData);

  console.log('\n--- Scenario 1 Analysis ---');
  console.log('EXPECTED: Supervisor should flag the news event');
  console.log('          and Decision Agent should PASS this trade.');
  console.log('');
  console.log('Actual Decision:', result.decision.decision);
  console.log('Rationale:', result.decision.rationale);
}

main().catch(console.error);
