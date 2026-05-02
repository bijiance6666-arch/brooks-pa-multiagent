/**
 * BrooksPAWorkflow — Orchestrates the multi-agent trading workflow
 *
 * Execution sequence:
 *   Chart Reader → Strategy Agent → Supervisor → Decision Agent
 *
 * Each agent processes the output of the previous and passes
 * its result to the next agent in the chain.
 */

const { ChartReaderAgent } = require('../agents/chartReader');
const { StrategyAgent } = require('../agents/strategyAgent');
const { SupervisorAgent } = require('../agents/supervisor');
const { DecisionAgent } = require('../agents/decisionAgent');

class BrooksPAWorkflow {
  constructor(options = {}) {
    this.chartReader = new ChartReaderAgent();
    this.strategyAgent = new StrategyAgent();
    this.supervisor = new SupervisorAgent();
    this.decisionAgent = new DecisionAgent();

    this.verbose = options.verbose !== false;
  }

  /**
   * Run the full multi-agent workflow for a given market data snapshot
   * @param {Object} marketData - Market data input
   * @param {Object} options - Workflow options
   * @returns {Object} Complete workflow result
   */
  async run(marketData, options = {}) {
    const startTime = Date.now();
    const log = this.verbose ? console.log : () => {};

    log('\n' + '='.repeat(60));
    log('[Workflow] Starting Brooks PA Multi-Agent Analysis');
    log('='.repeat(60));

    // ── Step 1: Chart Reader ──────────────────────────────────────
    log('\n[Step 1/4] Chart Reader: Analyzing market structure...');
    const chartResult = this.chartReader.analyze(marketData);

    // ── Step 2: Strategy Agent ──────────────────────────────────
    log('\n[Step 2/4] Strategy Agent: Formulating trading plan...');
    const strategyResult = this.strategyAgent.formulate(chartResult, marketData.m5Bar);

    // ── Step 3: Supervisor ───────────────────────────────────────
    log('\n[Step 3/4] Supervisor: Running Brooks Five Conditions check...');
    const supervisorResult = this.supervisor.review(
      chartResult,
      strategyResult,
      marketData.m5Bar
    );

    // ── Step 4: Decision Agent ───────────────────────────────────
    log('\n[Step 4/4] Decision Agent: Making final execution decision...');
    const decisionResult = this.decisionAgent.decide(
      chartResult,
      strategyResult,
      supervisorResult
    );

    const elapsed = Date.now() - startTime;

    const finalResult = {
      workflow: 'BrooksPAWorkflow',
      timestamp: new Date().toISOString(),
      elapsedMs: elapsed,
      chartReader: chartResult,
      strategy: strategyResult,
      supervisor: supervisorResult,
      decision: decisionResult,
      summary: this.summarize(decisionResult, chartResult),
    };

    log('\n' + '='.repeat(60));
    log('[Workflow] Complete');
    log(`[Workflow] Final Decision: ${decisionResult.decision}`);
    log(`[Workflow] Execution time: ${elapsed}ms`);
    log('='.repeat(60) + '\n');

    return finalResult;
  }

  summarize(decision, chartResult) {
    return {
      action: decision.decision,
      direction: decision.plan?.direction || null,
      marketType: chartResult?.marketType || 'UNKNOWN',
      qualityScore: decision.plan?.score || null,
      reason: decision.rationale,
    };
  }
}

module.exports = { BrooksPAWorkflow };
