/**
 * Supervisor Agent
 *
 * Role: Review the trading plan against Brooks' core principles
 *       and produce a quality gate verdict.
 * Inputs: Market analysis, trading plan, current bar data.
 * Output: APPROVED / CONDITIONAL / REJECTED with specific reasons.
 *
 * Brooks' Five Conditions (general framework — parameters are private):
 *   1. Correct market background (trade with the trend)
 *   2. Strong signal bar (clear entry signal)
 *   3. Decisive entry bar (confirmation of signal)
 *   4. Strong follow-through bar (momentum confirmation)
 *   5. Strict stop-loss discipline
 */

const Verdict = {
  APPROVED: 'APPROVED',
  CONDITIONAL: 'CONDITIONAL',
  REJECTED: 'REJECTED',
};

class SupervisorAgent {
  /**
   * Review trading plan against Brooks' Five Conditions
   * @param {Object} marketData - Chart Reader output
   * @param {Object} strategyPlan - Strategy Agent output
   * @param {Object} m5Bar - Current M5 bar
   * @returns {Object} Review verdict and detailed checks
   */
  review(marketData, strategyPlan, m5Bar) {
    console.log('[Supervisor] Running Brooks Five Conditions check...');

    if (!strategyPlan || !strategyPlan.primaryPlan) {
      return this.makeVerdict(Verdict.REJECTED, 'No trading plan available', [], [], marketData);
    }

    const plan = strategyPlan.primaryPlan;
    const checks = [];
    const passed = [];
    const failed = [];

    // Condition 1: Correct market background
    const c1 = this.checkMarketBackground(marketData, plan);
    checks.push(c1);
    c1.passed ? passed.push(c1.label) : failed.push(c1.label);

    // Condition 2: Strong signal bar
    const c2 = this.checkSignalBar(marketData, plan, m5Bar);
    checks.push(c2);
    c2.passed ? passed.push(c2.label) : failed.push(c2.label);

    // Condition 3: Decisive entry bar
    const c3 = this.checkEntryBar(marketData, plan, m5Bar);
    checks.push(c3);
    c3.passed ? passed.push(c3.label) : failed.push(c3.label);

    // Condition 4: Strong follow-through
    const c4 = this.checkFollowThrough(marketData, plan, m5Bar);
    checks.push(c4);
    c4.passed ? passed.push(c4.label) : failed.push(c4.label);

    // Condition 5: Stop-loss discipline
    const c5 = this.checkStopLoss(plan);
    checks.push(c5);
    c5.passed ? passed.push(c5.label) : failed.push(c5.label);

    // Determine overall verdict
    const allPassed = failed.length === 0;
    const mostlyPassed = failed.length <= 1 && passed.length >= 4;
    const verdict = allPassed ? Verdict.APPROVED
                    : mostlyPassed ? Verdict.CONDITIONAL
                    : Verdict.REJECTED;

    // Generate blocking reasons for failed checks
    const blockingReasons = failed.map(label => {
      const check = checks.find(c => c.label === label);
      return check ? `${label}: ${check.reason}` : label;
    });

    const conditionsMet = passed;
    const conditionsUnmet = failed;

    const result = {
      agent: 'Supervisor',
      verdict,
      checks,
      conditionsMet,
      conditionsUnmet,
      blockingReasons,
      passed: verdict !== Verdict.REJECTED,
      score: this.calculateSupervisorScore(checks),
      recommendation: this.getRecommendation(verdict, plan),
      summary: `${passed.length}/5 conditions met | Verdict: ${verdict}`,
    };

    console.log(`[Supervisor] ${result.summary}`);
    if (failed.length > 0) {
      console.log('[Supervisor] Failed conditions:');
      failed.forEach(f => console.log(`  - ${f}`));
    }

    return result;
  }

  checkMarketBackground(marketData, plan) {
    const { m30Trend, tradeDirection } = marketData;
    const { direction } = plan;

    // Rule: Only trade in the direction of the higher time frame trend
    // (This is a general principle — specific trend definition parameters are private)
    const trendMatches = m30Trend === 'BULLISH' && direction === 'LONG' ||
                         m30Trend === 'BEARISH' && direction === 'SHORT';

    // In a trading range, trades at the boundary are valid
    const inRangeAtBoundary = marketData.marketType === 'TRADING_RANGE' &&
      (marketData.keyLevels?.nearTop || marketData.keyLevels?.nearBottom);

    const passed = trendMatches || inRangeAtBoundary;

    return {
      label: '市场背景正确',
      condition: 'Trade in direction of M30 trend, or valid TR boundary setup',
      passed,
      reason: passed ? 'Market background aligns with trade direction'
                    : 'Market background contradicts trade direction (counter-trend trade)',
    };
  }

  checkSignalBar(marketData, plan, m5Bar) {
    // Brooks Rule: A signal bar is a bar that is large enough and clear enough
    // to represent a potential entry opportunity.
    // Key features: clear direction, reasonable size, not a doji

    if (!m5Bar) {
      return {
        label: '信号K棒扎实',
        condition: 'Clear directional bar with meaningful size',
        passed: false,
        reason: 'No M5 bar data available to assess signal bar',
      };
    }

    const bodySize = Math.abs(m5Bar.close - m5Bar.open);
    const totalRange = m5Bar.high - m5Bar.low;
    const bodyRatio = bodySize / totalRange;

    // Is the bar direction consistent with our intended trade?
    const isCorrectDirection = plan.direction === 'LONG'
      ? m5Bar.close > m5Bar.open
      : m5Bar.close < m5Bar.open;

    // Is the bar large enough (not a doji)?
    const hasSubstance = bodyRatio > 0.3;

    // Is the bar not too large (no runaway bar)?
    const notRunaway = bodyRatio < 0.9;

    const passed = isCorrectDirection && hasSubstance && notRunaway;

    return {
      label: '信号K棒扎实',
      condition: 'Directional bar with body > 30% of range, < 90%',
      passed,
      reason: passed ? 'Signal bar is clear and properly sized'
                    : !isCorrectDirection ? 'Signal bar direction opposes trade direction'
                    : !hasSubstance ? 'Signal bar is too small (doji or near-doji)'
                    : 'Signal bar is abnormally large (runaway bar, less reliable)',
    };
  }

  checkEntryBar(marketData, plan, m5Bar) {
    // Brooks Rule: The entry bar must close decisively beyond the signal bar
    // in the direction of the trade. Do NOT enter while the bar is still open.

    if (!m5Bar) {
      return {
        label: '入场K棒果断',
        condition: 'Entry bar closes beyond signal bar in trade direction',
        passed: false,
        reason: 'No M5 bar data to verify entry bar',
      };
    }

    const bodySize = Math.abs(m5Bar.close - m5Bar.open);
    const totalRange = m5Bar.high - m5Bar.low;
    const bodyRatio = bodySize / totalRange;

    // Strong entry bar: substantial body, decisive close
    const decisiveBody = bodyRatio > 0.5;
    const closeNearEdge = plan.direction === 'LONG'
      ? Math.abs(m5Bar.close - m5Bar.high) / totalRange < 0.2
      : Math.abs(m5Bar.close - m5Bar.low) / totalRange < 0.2;

    const passed = decisiveBody && closeNearEdge;

    return {
      label: '入场K棒果断',
      condition: 'Strong close near bar edge, body > 50% of range',
      passed,
      reason: passed ? 'Entry bar closes decisively in trade direction'
                    : !decisiveBody ? 'Entry bar lacks decisiveness (body too small)'
                    : 'Entry bar does not close near the edge in trade direction',
    };
  }

  checkFollowThrough(marketData, plan, m5Bar) {
    // Brooks Rule: After entry, expect follow-through in your direction.
    // If the bar immediately reverses, the setup is likely invalid.

    if (!m5Bar) {
      return {
        label: '跟进K棒强劲',
        condition: 'Follow-through bar confirms momentum in trade direction',
        passed: true,  // Cannot assess without data, pass with caution
        reason: 'No M5 bar data — assuming pass (requires manual verification)',
        caution: true,
      };
    }

    // Simple proxy: bar closes strongly in our direction
    const isStrongBar = plan.direction === 'LONG'
      ? (m5Bar.close - m5Bar.low) / (m5Bar.high - m5Bar.low) > 0.6
      : (m5Bar.high - m5Bar.close) / (m5Bar.high - m5Bar.low) > 0.6;

    return {
      label: '跟进K棒强劲',
      condition: 'Bar body/range suggests momentum in trade direction',
      passed: isStrongBar,
      reason: isStrongBar ? 'Bar shows strong momentum in trade direction'
                          : 'Bar lacks follow-through momentum — setup less reliable',
    };
  }

  checkStopLoss(plan) {
    // Rule: Always know your stop-loss before entering.
    // Never risk more than 1x your typical risk unit.

    const hasStop = plan.stopLoss && plan.stopLoss > 0;
    const hasEntry = plan.entry && plan.entry > 0;

    if (!hasStop || !hasEntry) {
      return {
        label: '严格止损纪律',
        condition: 'Stop-loss defined and within acceptable risk',
        passed: false,
        reason: 'Missing stop-loss or entry price',
      };
    }

    const risk = Math.abs(plan.entry - plan.stopLoss) / plan.entry;
    const withinLimits = risk < 0.005;  // Within 0.5%

    return {
      label: '严格止损纪律',
      condition: 'Stop-loss defined, risk < 0.5% of entry',
      passed: withinLimits,
      reason: withinLimits ? 'Stop-loss is appropriately sized'
                          : `Risk ${(risk * 100).toFixed(2)}% exceeds recommended maximum`,
    };
  }

  calculateSupervisorScore(checks) {
    if (!checks || checks.length === 0) return 0;
    const passed = checks.filter(c => c.passed).length;
    return Math.round((passed / checks.length) * 100);
  }

  getRecommendation(verdict, plan) {
    switch (verdict) {
      case Verdict.APPROVED:
        return plan.direction === 'LONG' ? 'EXECUTE_LONG' : 'EXECUTE_SHORT';
      case Verdict.CONDITIONAL:
        return 'WAIT_CONDITIONS';
      default:
        return 'PASS';
    }
  }
}

module.exports = { SupervisorAgent, Verdict };
