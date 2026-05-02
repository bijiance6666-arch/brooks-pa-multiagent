/**
 * Strategy Agent
 *
 * Role: Formulate trading plans based on Chart Reader's market type assessment.
 * Inputs: Market type, key levels, trade direction, current M5 bar.
 * Output: A trading plan with entry, stop-loss, target, and conditions.
 *
 * Note: The specific entry criteria and parameters are framework-level
 * placeholders. Actual entry rules remain private.
 */

const EntryType = {
  PULLBACK: 'PULLBACK',
  BREAKOUT: 'BREAKOUT',
  FBO: 'FBO',          // Failed Breakout Out
  FBI: 'FBI',          // Failed Breakdown In
  REVERSAL: 'REVERSAL',
  NONE: 'NONE',
};

const PlanStatus = {
  CANDIDATE: 'CANDIDATE',
  CONDITIONAL: 'CONDITIONAL',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
};

class StrategyAgent {
  /**
   * Generate trading plan(s) based on market context
   * @param {Object} chartData - Output from ChartReader
   * @param {Object} m5Bar - Current M5 bar data
   * @returns {Object} Trading plan(s)
   */
  formulate(chartData, m5Bar) {
    const { marketType, keyLevels, tradeDirection, m30Trend } = chartData;

    console.log('[Strategy] Formulating trading plan...');
    console.log(`[Strategy] Direction: ${tradeDirection}, Market Type: ${marketType}`);

    const plans = [];

    // Case 1: Trend continuation (only trade in trend direction)
    if (this.isTrendContinuation(marketType, tradeDirection)) {
      const plan = this.buildTrendPlan(chartData, m5Bar, tradeDirection);
      if (plan) plans.push(plan);
    }

    // Case 2: Trading range mean reversion
    if (marketType === 'TRADING_RANGE' && keyLevels.resistance && keyLevels.support) {
      const plan = this.buildRangePlan(chartData, m5Bar);
      if (plan) plans.push(plan);
    }

    // Case 3: Reversal at range boundary
    if (marketType.startsWith('REVERSAL')) {
      const plan = this.buildReversalPlan(chartData, m5Bar);
      if (plan) plans.push(plan);
    }

    // Case 4: No clear setup — watch and wait
    if (plans.length === 0) {
      plans.push({
        status: PlanStatus.REJECTED,
        reason: 'No qualifying setup found. Market not at a decisive point.',
        recommendation: 'WAIT',
      });
    }

    // Rank plans by quality
    plans.sort((a, b) => (b.score || 0) - (a.score || 0));

    console.log(`[Strategy] ${plans.length} plan(s) generated`);
    plans.forEach((p, i) => {
      if (p.status !== PlanStatus.REJECTED) {
        console.log(`  Plan ${i + 1}: ${p.type} | Score: ${p.score}/10 | Status: ${p.status}`);
      }
    });

    return {
      agent: 'StrategyAgent',
      plans,
      primaryPlan: plans[0] || null,
      marketType,
      tradeDirection,
    };
  }

  isTrendContinuation(marketType, tradeDirection) {
    return (marketType === 'TREND_UP' && tradeDirection === 'LONG') ||
           (marketType === 'TREND_DOWN' && tradeDirection === 'SHORT');
  }

  buildTrendPlan(chartData, m5Bar, direction) {
    const { keyLevels, m30Trend } = chartData;
    const isLong = direction === 'LONG';

    // Only form a plan if M5 is at a pullback, not at an extension
    const atPullback = this.checkForPullback(m5Bar, keyLevels, direction);
    if (!atPullback) return null;

    const entry = isLong ? keyLevels.support * 1.002 : keyLevels.resistance * 0.998;
    const stopLoss = isLong ? keyLevels.support * 0.998 : keyLevels.resistance * 1.002;
    const riskPct = Math.abs(entry - stopLoss) / entry * 100;
    const target = isLong
      ? keyLevels.resistance * 0.999
      : keyLevels.support * 1.001;
    const rewardRiskRatio = Math.abs(target - entry) / Math.abs(entry - stopLoss);

    return {
      agent: 'StrategyAgent',
      type: EntryType.PULLBACK,
      direction,
      status: PlanStatus.CANDIDATE,
      entry,
      stopLoss,
      target,
      riskPct: riskPct.toFixed(3),
      rewardRiskRatio: rewardRiskRatio.toFixed(2),
      score: this.scorePlan(atPullback, riskPct, rewardRiskRatio, m5Bar),
      conditions: this.getEntryConditions(direction),
      m5BarStatus: this.getM5BarStatus(m5Bar),
      note: 'Higher probability pullback entry in trend direction',
    };
  }

  buildRangePlan(chartData, m5Bar) {
    const { keyLevels, m30Trend } = chartData;

    // At top of range: short bias
    if (keyLevels.distanceFromTop < 2) {
      return {
        agent: 'StrategyAgent',
        type: EntryType.FBO,
        direction: 'SHORT',
        status: PlanStatus.CONDITIONAL,
        entry: keyLevels.resistance,
        stopLoss: keyLevels.resistance * 1.002,
        target: keyLevels.midPrice || keyLevels.support,
        conditions: this.getEntryConditions('SHORT'),
        m5BarStatus: this.getM5BarStatus(m5Bar),
        note: 'Range top: await FBO confirmation before shorting',
      };
    }

    // At bottom of range: long bias
    if (keyLevels.distanceFromBottom < 2) {
      return {
        agent: 'StrategyAgent',
        type: EntryType.FBI,
        direction: 'LONG',
        status: PlanStatus.CONDITIONAL,
        entry: keyLevels.support,
        stopLoss: keyLevels.support * 0.998,
        target: keyLevels.midPrice || keyLevels.resistance,
        conditions: this.getEntryConditions('LONG'),
        m5BarStatus: this.getM5BarStatus(m5Bar),
        note: 'Range bottom: await FBI confirmation before buying',
      };
    }

    return null;
  }

  buildReversalPlan(chartData, m5Bar) {
    const { marketType, keyLevels } = chartData;
    const isReversalUp = marketType === 'REVERSAL_UP';
    const direction = isReversalUp ? 'LONG' : 'SHORT';
    const level = isReversalUp ? keyLevels.support : keyLevels.resistance;

    if (!level) return null;

    const entry = level;
    const stopLoss = isReversalUp ? level * 0.998 : level * 1.002;

    return {
      agent: 'StrategyAgent',
      type: EntryType.REVERSAL,
      direction,
      status: PlanStatus.CONDITIONAL,
      entry,
      stopLoss,
      target: isReversalUp ? keyLevels.resistance : keyLevels.support,
      conditions: this.getEntryConditions(direction),
      m5BarStatus: this.getM5BarStatus(m5Bar),
      note: 'Reversal at range boundary: require full bar confirmation',
    };
  }

  checkForPullback(m5Bar, keyLevels, direction) {
    if (!m5Bar) return false;
    const { keyLevels: kl } = this;
    const isLong = direction === 'LONG';

    // Pullback: price has retreated toward key level, not extended away from it
    const nearSupport = kl.support && Math.abs(m5Bar.close - kl.support) / kl.support < 0.003;
    const nearResistance = kl.resistance && Math.abs(m5Bar.close - kl.resistance) / kl.resistance < 0.003;

    return isLong ? nearSupport : nearResistance;
  }

  scorePlan(pullback, riskPct, rewardRiskRatio, m5Bar) {
    let score = 5;

    if (pullback) score += 2;
    if (riskPct < 0.3) score += 1.5;
    if (riskPct < 0.2) score += 1;
    if (rewardRiskRatio >= 2) score += 1;
    if (m5Bar && !this.isDojiBar(m5Bar)) score += 0.5;

    return Math.min(10, score);
  }

  isDojiBar(m5Bar) {
    const bodySize = Math.abs(m5Bar.close - m5Bar.open);
    const totalRange = m5Bar.high - m5Bar.low;
    return bodySize / totalRange < 0.1;
  }

  getEntryConditions(direction) {
    // These are general PA principles, not specific parameters
    return [
      `市场背景方向与交易方向一致（${direction}）`,
      'M5 信号K棒已形成（不等未收盘K棒）',
      'M5 入场K棒收盘确认（不等K棒中途）',
      '止损设置在合理价位（不超过1倍风险）',
    ];
  }

  getM5BarStatus(m5Bar) {
    if (!m5Bar) return { status: 'NO_DATA', description: 'M5 bar data not available' };

    const bodySize = Math.abs(m5Bar.close - m5Bar.open);
    const totalRange = m5Bar.high - m5Bar.low;
    const bodyRatio = bodySize / totalRange;

    return {
      bodyRatio: bodyRatio.toFixed(2),
      isBullish: m5Bar.close > m5Bar.open,
      isDoji: bodyRatio < 0.1,
      isNearHigh: Math.abs(m5Bar.close - m5Bar.high) / totalRange < 0.2,
      isNearLow: Math.abs(m5Bar.close - m5Bar.low) / totalRange < 0.2,
    };
  }
}

module.exports = { StrategyAgent, EntryType, PlanStatus };
