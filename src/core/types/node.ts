import type { Account } from './account';
import type { RetirementGoal } from './goal';
import type { FilingStatus } from './tax';

/** All custom node type identifiers */
export type FinanceNodeType =
  | 'accountNode'
  | 'engineNode'
  | 'outputNode'
  | 'incomeNode'
  | 'goalNode'
  | 'taxNode'
  | 'w2TaxNode'
  | 'grossPayNode'
  | 'expensesNode'
  | 'variableNode';

/** Data payload for AccountNode */
export interface AccountNodeData {
  accountId: string;
  label: string;
  account?: Account;
}

/** Data payload for EngineNode */
export interface EngineNodeData {
  label: string;
}

/** Output display modes */
export type OutputMetric = 'net_worth' | 'goal_status' | 'monthly_income' | 'net_monthly_income' | 'take_home_pay' | 'disposable_income';

/** Data payload for OutputNode */
export interface OutputNodeData {
  label: string;
  metric: OutputMetric;
  value?: string;
  status?: string;
}

/** Income source types */
export type IncomeSourceType = 'social_security' | 'pension_income' | '401k_drawdown' | 'roth_drawdown';

/** Data payload for IncomeNode */
export interface IncomeNodeData {
  label: string;
  sourceType: IncomeSourceType;
  monthlyAmount: number;
  autoEstimate?: boolean; // for SS: auto-calculate from income
}

/** Data payload for GoalNode */
export interface GoalNodeData {
  label: string;
  goalId: string;
  goal?: RetirementGoal;
}

/** Data payload for TaxNode */
export interface TaxNodeData {
  label: string;
  filingStatus: FilingStatus;
  stateRate: number; // decimal, e.g. 0.05
}

/** Data payload for VariableNode */
export interface VariableNodeData {
  label: string;
  key: string; // e.g. 'inflationRate', 'withdrawalRate'
  value: number;
  suffix: string; // e.g. '%', ' years'
  min: number;
  max: number;
  step: number;
}

/** Data payload for W2TaxNode (working years income tax) */
export interface W2TaxNodeData {
  label: string;
}

/** Data payload for GrossPayNode (gross income input) */
export interface GrossPayNodeData {
  label: string;
}

/** Data payload for ExpensesNode (monthly expenses input) */
export interface ExpensesNodeData {
  label: string;
}

/** Union of all node data types */
export type FinanceNodeData =
  | AccountNodeData
  | EngineNodeData
  | OutputNodeData
  | IncomeNodeData
  | GoalNodeData
  | TaxNodeData
  | W2TaxNodeData
  | GrossPayNodeData
  | ExpensesNodeData
  | VariableNodeData;

/** Node palette item (for sidebar drag) */
export interface NodePaletteItem {
  type: FinanceNodeType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  category: 'accounts' | 'processing' | 'output' | 'goals' | 'income';
}
