/**
 * Brooks Concepts — Key Price Action Terminology
 *
 * These are general Al Brooks PA concepts adapted for the framework.
 * Specific parameters and thresholds remain private to the trader.
 *
 * Key concepts:
 * - Signal Bar (信号K棒): The bar that signals a potential trade
 * - Entry Bar (入场K棒): The bar that confirms the signal and triggers entry
 * - Follow-Through Bar (跟进K棒): Bar after entry confirming direction
 * - FBO (Failed Breakout Out): Price fails to break and reverses
 * - FBI (Failed Breakdown In): Failed breakdown reversed to upside
 * - TR (Trading Range): Consolidation zone
 */

const SignalType = {
  TREND_CONTINUATION: 'TREND_CONTINUATION',
  TREND_REVERSAL: 'TREND_REVERSAL',
  TRADE_RANGE_BOUNDARY: 'TR_RANGE_BOUNDARY',
  PULLBACK: 'PULLBACK',
  BREAKOUT: 'BREAKOUT',
  FBO: 'FBO',
  FBI: 'FBI',
};

const BarPattern = {
  OUTSIDE_BAR: 'OUTSIDE_BAR',
  INSIDE_BAR: 'INSIDE_BAR',
  DOJI: 'DOJI',
  MARUBOZU: 'MARUBOZU',
  HAMMER: 'HAMMER',
  SHOOTING_STAR: 'SHOOTING_STAR',
  ENGULFING_BULLISH: 'ENGULFING_BULLISH',
  ENGULFING_BEARISH: 'ENGULFING_BEARISH',
};

const TrendStrength = {
  STRONG: 'STRONG',
  MODERATE: 'MODERATE',
  WEAK: 'WEAK',
};

/**
 * Identify bar pattern type
 * @param {Object} bar - OHLC bar { open, high, low, close }
 * @returns {string} Pattern name
 */
function identifyBarPattern(bar) {
  const { open, high, low, close } = bar;
  const bodySize = Math.abs(close - open);
  const totalRange = high - low;

  if (totalRange === 0) return BarPattern.DOJI;

  const bodyRatio = bodySize / totalRange;

  if (bodyRatio < 0.1) return BarPattern.DOJI;
  if (bodyRatio > 0.9) return BarPattern.MARUBOZU;

  const upperShadow = high - Math.max(open, close);
  const lowerShadow = Math.min(open, close) - low;
  const isBullish = close > open;

  if (isBullish && lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
    return BarPattern.HAMMER;
  }
  if (!isBullish && upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5) {
    return BarPattern.SHOOTING_STAR;
  }

  return null;
}

/**
 * Classify signal based on bar and context
 * @param {Object} bar - Current bar
 * @param {Object} prevBar - Previous bar
 * @param {string} tradeDirection - LONG or SHORT
 * @returns {string} Signal type
 */
function classifySignal(bar, prevBar, tradeDirection) {
  const pattern = identifyBarPattern(bar);

  if (pattern === BarPattern.HAMMER && tradeDirection === 'LONG') {
    return SignalType.TREND_REVERSAL;
  }
  if (pattern === BarPattern.SHOOTING_STAR && tradeDirection === 'SHORT') {
    return SignalType.TREND_REVERSAL;
  }

  return SignalType.TREND_CONTINUATION;
}

/**
 * Evaluate trend strength based on bar sequence
 * @param {Array} bars - Array of OHLC bars
 * @param {string} direction - LONG or SHORT
 * @returns {string} Trend strength
 */
function evaluateTrendStrength(bars, direction) {
  if (!bars || bars.length < 5) return TrendStrength.WEAK;

  const isLong = direction === 'LONG';
  let consecutiveInDirection = 0;
  let consecutiveAgainst = 0;

  for (let i = bars.length - 1; i >= Math.max(0, bars.length - 10); i--) {
    const bar = bars[i];
    const movingWithTrend = isLong ? bar.close > bar.open : bar.close < bar.open;

    if (movingWithTrend) {
      consecutiveInDirection++;
      consecutiveAgainst = 0;
    } else {
      consecutiveAgainst++;
      consecutiveInDirection = 0;
    }

    if (consecutiveInDirection >= 3) return TrendStrength.STRONG;
    if (consecutiveAgainst >= 2) return TrendStrength.WEAK;
  }

  return TrendStrength.MODERATE;
}

module.exports = {
  SignalType,
  BarPattern,
  TrendStrength,
  identifyBarPattern,
  classifySignal,
  evaluateTrendStrength,
};
