import type { FinanceFlowNode, FinanceFlowEdge } from '../../core/types/flow';

/**
 * Default flow layout — full income-to-retirement pipeline:
 *
 *   Gross Pay -> W-2 Tax -> Take-Home ─┐
 *                                       ├─> Disposable -> [5 Accounts] -> Engine -> Outputs
 *                           Expenses  ─┘    SS Income ->
 *   Target Age / Inflation (below engine) -> Engine
 *   Gross Income (retirement) -> Tax Calculator -> Net Income
 */

export const DEFAULT_NODES: FinanceFlowNode[] = [
  // ── Income Pipeline (cols 1-4, left side) ──────────────────

  // Col 1: Gross Pay
  {
    id: 'node-grosspay',
    type: 'grossPayNode',
    position: { x: 50, y: 290 },
    data: { label: 'Gross Pay' },
  },

  // Col 2: W-2 Tax Calculator
  {
    id: 'node-w2tax',
    type: 'w2TaxNode',
    position: { x: 290, y: 240 },
    data: { label: 'W-2 Income Tax' },
  },

  // Col 3: Take-Home Pay + Expenses
  {
    id: 'node-takehome',
    type: 'outputNode',
    position: { x: 540, y: 200 },
    data: { label: 'Take-Home Pay', metric: 'take_home_pay' },
  },
  {
    id: 'node-expenses',
    type: 'expensesNode',
    position: { x: 540, y: 360 },
    data: { label: 'Monthly Expenses' },
  },

  // Col 4: Disposable Income
  {
    id: 'node-disposable',
    type: 'outputNode',
    position: { x: 790, y: 270 },
    data: { label: 'Disposable Income', metric: 'disposable_income' },
  },

  // ── Account Nodes (col 5, 5 accounts) ──────────────────────

  {
    id: 'node-growth',
    type: 'accountNode',
    position: { x: 1040, y: 30 },
    data: { label: 'Growth Brokerage', accountId: 'acc-growth-default' },
  },
  {
    id: 'node-roth',
    type: 'accountNode',
    position: { x: 1040, y: 165 },
    data: { label: 'Roth IRA', accountId: 'acc-roth-default' },
  },
  {
    id: 'node-index',
    type: 'accountNode',
    position: { x: 1040, y: 300 },
    data: { label: 'Index Portfolio', accountId: 'acc-index-default' },
  },
  {
    id: 'node-savings',
    type: 'accountNode',
    position: { x: 1040, y: 435 },
    data: { label: 'Savings', accountId: 'acc-savings-default' },
  },
  {
    id: 'node-yolo',
    type: 'accountNode',
    position: { x: 1040, y: 570 },
    data: { label: 'YOLO', accountId: 'acc-yolo-default' },
  },

  // ── Social Security Income (below accounts) ─────────────────
  {
    id: 'node-ss',
    type: 'incomeNode',
    position: { x: 1040, y: 710 },
    data: { label: 'Social Security', sourceType: 'social_security', monthlyAmount: 0, autoEstimate: true },
  },

  // ── Engine Node (col 6) ────────────────────────────────────
  {
    id: 'node-engine',
    type: 'engineNode',
    position: { x: 1320, y: 330 },
    data: { label: 'Retirement Plan Engine' },
  },

  // ── Output Nodes (col 7) ───────────────────────────────────
  {
    id: 'node-networth',
    type: 'outputNode',
    position: { x: 1610, y: 160 },
    data: { label: 'Net Worth', metric: 'net_worth' },
  },
  {
    id: 'node-goalstatus',
    type: 'outputNode',
    position: { x: 1610, y: 300 },
    data: { label: 'Goal Status', metric: 'goal_status' },
  },
  {
    id: 'node-grossincome',
    type: 'outputNode',
    position: { x: 1610, y: 440 },
    data: { label: 'Gross Monthly Income', metric: 'monthly_income' },
  },

  // ── Retirement Tax Calculator ──────────────────────────────
  {
    id: 'node-tax',
    type: 'taxNode',
    position: { x: 1840, y: 440 },
    data: { label: 'Tax Calculator', filingStatus: 'single', stateRate: 0.05 },
  },

  // ── Net Income Output (far right) ─────────────────────────
  {
    id: 'node-netincome',
    type: 'outputNode',
    position: { x: 2060, y: 440 },
    data: { label: 'Net Monthly Income', metric: 'net_monthly_income' },
  },

  // ── Goal / Variable Nodes (bottom row) ────────────────────
  {
    id: 'node-targetage',
    type: 'goalNode',
    position: { x: 1260, y: 730 },
    data: { label: 'Target Age', goalId: 'goal-retirement-default' },
  },
  {
    id: 'node-inflation',
    type: 'variableNode',
    position: { x: 1460, y: 730 },
    data: { label: 'Inflation Rate', key: 'inflationRate', value: 3, suffix: '%', min: 0, max: 10, step: 0.1 },
  },
];

export const DEFAULT_EDGES: FinanceFlowEdge[] = [
  // ── Income Pipeline ──────────────────────────────────────
  { id: 'e-gp-w2',    source: 'node-grosspay',   target: 'node-w2tax',       type: 'glowEdge', animated: true },
  { id: 'e-w2-th',    source: 'node-w2tax',       target: 'node-takehome',    type: 'glowEdge', animated: true },
  { id: 'e-th-disp',  source: 'node-takehome',    target: 'node-disposable',  type: 'glowEdge', animated: true },
  { id: 'e-exp-disp', source: 'node-expenses',    target: 'node-disposable',  type: 'glowEdge', animated: true },

  // ── Disposable Income -> All 5 Accounts ──────────────────
  { id: 'e-disp-growth',   source: 'node-disposable', target: 'node-growth',   type: 'glowEdge', animated: true },
  { id: 'e-disp-roth',     source: 'node-disposable', target: 'node-roth',     type: 'glowEdge', animated: true },
  { id: 'e-disp-index',    source: 'node-disposable', target: 'node-index',    type: 'glowEdge', animated: true },
  { id: 'e-disp-savings',  source: 'node-disposable', target: 'node-savings',  type: 'glowEdge', animated: true },
  { id: 'e-disp-yolo',     source: 'node-disposable', target: 'node-yolo',     type: 'glowEdge', animated: true },

  // ── All 5 Accounts -> Engine ──────────────────────────────
  { id: 'e-growth-eng',  source: 'node-growth',   target: 'node-engine', type: 'glowEdge', animated: true },
  { id: 'e-roth-eng',    source: 'node-roth',     target: 'node-engine', type: 'glowEdge', animated: true },
  { id: 'e-index-eng',   source: 'node-index',    target: 'node-engine', type: 'glowEdge', animated: true },
  { id: 'e-savings-eng', source: 'node-savings',  target: 'node-engine', type: 'glowEdge', animated: true },
  { id: 'e-yolo-eng',    source: 'node-yolo',     target: 'node-engine', type: 'glowEdge', animated: true },

  // ── Social Security -> Engine ─────────────────────────────
  { id: 'e-ss-eng', source: 'node-ss', target: 'node-engine', type: 'glowEdge', animated: true },

  // ── Engine -> Outputs ─────────────────────────────────────
  { id: 'e-eng-nw',   source: 'node-engine', target: 'node-networth',   type: 'glowEdge', animated: true },
  { id: 'e-eng-goal', source: 'node-engine', target: 'node-goalstatus', type: 'glowEdge', animated: true },
  { id: 'e-eng-gross',source: 'node-engine', target: 'node-grossincome',type: 'glowEdge', animated: true },

  // ── Retirement: Gross -> Tax -> Net ───────────────────────
  { id: 'e-gross-tax', source: 'node-grossincome', target: 'node-tax',      type: 'glowEdge', animated: true },
  { id: 'e-tax-net',   source: 'node-tax',         target: 'node-netincome',type: 'glowEdge', animated: true },

  // ── Variables -> Engine ───────────────────────────────────
  { id: 'e-age-eng', source: 'node-targetage', target: 'node-engine', type: 'glowEdge', animated: true },
  { id: 'e-inf-eng', source: 'node-inflation', target: 'node-engine', type: 'glowEdge', animated: true },
];
