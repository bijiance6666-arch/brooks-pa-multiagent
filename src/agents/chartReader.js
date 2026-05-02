/**
 * Chart Reader Agent
 *
 * Role: Identify the current market structure on the chart.
 * Inputs: M30 chart context, current price, recent bar sequence.
 * Output: Market type assessment (Trend / Trading Range / Reversal).
 *
 * Note: This is a framework demonstration. The specific identification
 * criteria and thresholds are intentionally omitted to protect
 * proprietary strategy rules.
 */

const MarketType = {
  TREND_UP: 'TREND_UP',
  TREND_DOWN: 'TREND_DOWN',
  TRADING_RANGE: 'TRADING_RANGE',
  REVERSAL_UP: 'REVERSAL_UP',
  REVERSAL_DOWN: 'REVERSAL_DOWN',
  UNCERTAIN: 'UNCERTAIN',
};

class ChartReaderAgent {
  /**
   * Analyze market structure
   * @param {Object} marketData - Market data including M30 bars, price levels, EMA
   * @returns {Object} Market type and key structural observations
   */
  analyze(marketData) {
    const { m30Bars, currentPrice, ema, recentHighs, recentLows } = marketData;

    console.log('[Chart Reader] Analyzing market structure...');

    // Step 1: Identify the higher time frame direction (M30)
    const m30Trend = this.assessM30Trend(m30Bars, ema);

    // Step 2: Look for trading range boundaries
    const rangeInfo = this.assessTradingRange(recentHighs, recentLows, currentPrice);

    // Step 3: Detect potential reversal signals
    const reversalSignals = this.detectReversalSignals(m30Bars, rangeInfo);

    // Step 4: Determine final market type
    const marketType = this.determineMarketType(m30Trend, rangeInfo, reversalSignals);

    // Step 5: Key support and resistance levels
    const levels = this.identifyKeyLevels(recentHighs, recentLows, currentPrice);

    const result = {
      agent: 'ChartReader',
      marketType,
      m30Trend,
      rangeInfo,
      reversalSignals,
      keyLevels: levels,
      tradeDirection: this.inferTradeDirection(marketType),
      confidence: this.assessConfidence(reversalSignals, rangeInfo),
      summary: this.generateSummary(marketType, m30Trend, rangeInfo),
    };

    console.log(`[Chart Reader] Market Type: ${marketType}`);
    console.log(`[Chart Reader] Trade Direction: ${result.tradeDirection}`);
    console.log(`[Chart Reader] Confidence: ${result.confidence}/5`);

    return result;
  }

  assessM30Trend(m30Bars, ema) {
    if (!m30Bars || m30Bars.length < 20) return 'UNCERTAIN';

    // Check if price is above/below EMA for direction
    const recentBars = m30Bars.slice(-10);
    const avgClose = recentBars.reduce((s, b) => s + b.close, 0) / recentBars.length;

    const aboveEMA = avgClose > ema;
    const barsAboveEMA = recentBars.filter(b => b.close > ema).length;
    const strongBias = barsAboveEMA / recentBars.length;

    if (strongBias > 0.7 && aboveEMA) return 'BULLISH';
    if (strongBias < 0.3 && !aboveEMA) return 'BEARISH';
    return 'NEUTRAL';
  }

  assessTradingRange(recentHighs, recentLows, currentPrice) {
    if (!recentHighs || !recentLows || recentHighs.length < 2) {
      return { inRange: false };
    }

    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);
    const rangeWidth = highest - lowest;
    const midPrice = (highest + lowest) / 2;
    const isInRange = currentPrice >= lowest && currentPrice <= highest;
    const nearTop = currentPrice > highest * 0.98;
    const nearBottom = currentPrice < lowest * 1.02;

    return {
      inRange: isInRange,
      highest,
      lowest,
      rangeWidth,
      midPrice,
      nearTop,
      nearBottom,
      rangeWidthPct: (rangeWidth / currentPrice) * 100,
    };
  }

  detectReversalSignals(m30Bars, rangeInfo) {
    if (!m30Bars || m30Bars.length < 5) return [];

    const signals = [];
    const recent = m30Bars.slice(-5);

    // Look for bar characteristics that suggest reversal potential
    // Key signal: bars getting smaller near range boundaries
    const lastBar = recent[recent.length - 1];
    const barsGettingSmaller = this.checkForCompression(recent);
    const momentumDivergence = this.checkMomentumDivergence(recent);

    if (barsGettingSmaller && rangeInfo.nearTop) {
      signals.push({ type: 'COMPRESSION_AT_TOP', strength: 'HIGH' });
    }
    if (barsGettingSmaller && rangeInfo.nearBottom) {
      signals.push({ type: 'COMPRESSION_AT_BOTTOM', strength: 'HIGH' });
    }
    if (momentumDivergence) {
      signals.push({ type: 'MOMENTUM_DIVERGENCE', strength: 'MEDIUM' });
    }

    return signals;
  }

  checkForCompression(bars) {
    if (bars.length < 3) return false;
    const recent = bars.slice(-3);
    const ranges = recent.map(b => Math.abs(b.close - b.open));
    return ranges[2] < ranges[1] && ranges[1] < ranges[0];
  }

  checkMomentumDivergence(bars) {
    if (bars.length < 5) return false;
    const closes = bars.map(b => b.close);
    const highs = bars.map(b => b.high);
    // Simple check: if highs stopped making new highs but closes still strong
    const lastHighs = highs.slice(-3);
    const makingLowerHighs = lastHighs[2] < lastHighs[1] && lastHighs[1] < lastHighs[0];
    return makingLowerHighs;
  }

  determineMarketType(m30Trend, rangeInfo, reversalSignals) {
    if (rangeInfo.inRange && reversalSignals.length > 0) {
      if (rangeInfo.nearTop) return MarketType.REVERSAL_DOWN;
      if (rangeInfo.nearBottom) return MarketType.REVERSAL_UP;
      return MarketType.TRADING_RANGE;
    }
    if (rangeInfo.inRange) return MarketType.TRADING_RANGE;
    if (m30Trend === 'BULLISH') return MarketType.TREND_UP;
    if (m30Trend === 'BEARISH') return MarketType.TREND_DOWN;
    return MarketType.UNCERTAIN;
  }

  identifyKeyLevels(recentHighs, recentLows, currentPrice) {
    if (!recentHighs || !recentLows) return { resistance: null, support: null };

    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);

    return {
      resistance: highest,
      support: lowest,
      distanceFromTop: ((highest - currentPrice) / currentPrice) * 100,
      distanceFromBottom: ((currentPrice - lowest) / currentPrice) * 100,
    };
  }

  inferTradeDirection(marketType) {
    switch (marketType) {
      case MarketType.TREND_UP: return 'LONG';
      case MarketType.TREND_DOWN: return 'SHORT';
      case MarketType.REVERSAL_UP: return 'LONG';
      case MarketType.REVERSAL_DOWN: return 'SHORT';
      case MarketType.TRADING_RANGE: return 'WAIT';
      default: return 'WAIT';
    }
  }

  assessConfidence(reversalSignals, rangeInfo) {
    let confidence = 2;

    if (reversalSignals.length >= 2) confidence += 1;
    if (rangeInfo.nearTop || rangeInfo.nearBottom) confidence += 1;
    if (reversalSignals.some(s => s.strength === 'HIGH')) confidence += 1;

    return Math.min(5, confidence);
  }

  generateSummary(marketType, m30Trend, rangeInfo) {
    const parts = [`M30趋势: ${m30Trend}`];
    if (rangeInfo.inRange) {
      parts.push(`在TR内，距上轨${rangeInfo.distanceFromTop?.toFixed(1)}%，距下轨${rangeInfo.distanceFromBottom?.toFixed(1)}%`);
    }
    parts.push(`市场类型: ${marketType}`);
    return parts.join(' | ');
  }
}

module.exports = { ChartReaderAgent, MarketType };
