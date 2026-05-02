/**
 * Decision Agent
 *
 * Role: Make the final trade execution decision after receiving
 *       Chart Reader + Strategy Plan + Supervisor review.
 * Inputs: Market analysis, trading plan, supervisor review.
 * Output: Final decision: EXECUTE / WAIT / PASS.
 *
 * The decision is the trader's judgment — the AI assists but does not replace it.
 */

const Decision = {
  EXECUTE: 'EXECUTE',
  WAIT: 'WAIT',
  PASS: 'PASS',
  INVALID: 'INVALID',
};

class DecisionAgent {
  /**
   * Make final trading decision
   * @param {Object} marketData - Chart reader output
   * @param {Object} strategyPlan - Strategy agent output
   * @param {Object} supervisorReview - Supervisor review output
   * @returns {Object} Final decision with rationale
   */
  decide(marketData, strategyPlan, supervisorReview) {
    console.log('[Decision Agent] Synthesizing all inputs...');

    // Check for invalid inputs
    if (!marketData || !strategyPlan) {
      return this.makeDecision(Decision.INVALID, null, 'Missing required inputs from Chart Reader or Strategy Agent');
    }

    const plan = strategyPlan.primaryPlan || strategyPlan;

    // Supervisor has found blocking issues
    if (supervisorReview && !supervisorReview.passed) {
      const verdict = supervisorReview.verdict;
      const blockingReasons = supervisorReview.blockingReasons || [];

      console.log('[Decision Agent] Supervisor blocked:');
      blockingReasons.forEach(r => console.log(`  - ${r}`));

      return this.makeDecision(
        Decision.PASS,
        plan,
        `Blocked by Supervisor: ${verdict}. ${blockingReasons.join(' ')}`
      );
    }

    // Plan rejected by Strategy Agent
    if (plan.status === 'REJECTED') {
      return this.makeDecision(Decision.PASS, plan, `Strategy rejected: ${plan.reason || 'No qualifying setup'}`);
    }

    // No plan at all
    if (!plan || plan.status === 'REJECTED') {
      return this.makeDecision(Decision.WAIT, null, 'No trading plan available. Await next bar.');
    }

    // Supervisor conditionally approved — check conditions
    if (plan.status === 'CONDITIONAL') {
      const conditionsMet = supervisorReview?.conditionsMet || [];
      const conditionsUnmet = supervisorReview?.conditionsUnmet || [];

      if (conditionsUnmet.length > 0) {
        return this.makeDecision(
          Decision.WAIT,
          plan,
          `Unmet conditions: ${conditionsUnmet.join(', ')}. Wait for better setup.`
        );
      }
    }

    // Supervisor fully approved
    if (supervisorReview?.passed && supervisorReview.verdict === 'APPROVED') {
      const score = plan.score || 5;
      if (score >= 7) {
        return this.makeDecision(Decision.EXECUTE, plan, 'All checks passed. Plan quality high. Execute.');
      } else if (score >= 5) {
        return this.makeDecision(
          Decision.WAIT,
          plan,
          'Plan passes checks but quality score is moderate. Wait for confirmation bar.'
        );
      } else {
        return this.makeDecision(Decision.WAIT, plan, 'Plan quality too low. Pass this setup.');
      }
    }

    // Default: if plan exists but no supervisor review, use strategy score
    if (plan.status === 'CANDIDATE') {
      const score = plan.score || 5;
      if (score >= 7) {
        return this.makeDecision(Decision.EXECUTE, plan, `High quality plan (score: ${score}/10). Execute.`);
      } else {
        return this.makeDecision(Decision.WAIT, plan, `Plan score ${score}/10. Wait for better setup.`);
      }
    }

    return this.makeDecision(Decision.WAIT, plan, 'Insufficient conviction. Hold.');
  }

  makeDecision(decision, plan, rationale) {
    const result = {
      agent: 'DecisionAgent',
      decision,
      plan: plan ? {
        type: plan.type,
        direction: plan.direction,
        entry: plan.entry,
        stopLoss: plan.stopLoss,
        target: plan.target,
        riskPct: plan.riskPct,
        score: plan.score,
      } : null,
      rationale,
      timestamp: new Date().toISOString(),
    };

    const emoji = {
      EXECUTE: '>>>',
      WAIT: '...',
      PASS: '---',
      INVALID: 'XXX',
    };

    console.log(`[Decision] ${emoji[decision]} ${decision}`);
    console.log(`[Decision] Reason: ${rationale}`);

    return result;
  }
}

module.exports = { DecisionAgent, Decision };
