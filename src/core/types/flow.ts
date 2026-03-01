import type { Node, Edge } from '@xyflow/react';
import type {
  AccountNodeData,
  EngineNodeData,
  OutputNodeData,
  IncomeNodeData,
  GoalNodeData,
  TaxNodeData,
  W2TaxNodeData,
  GrossPayNodeData,
  ExpensesNodeData,
  VariableNodeData,
  ChartNodeData,
} from './node';
import type { Account } from './account';
import type { RetirementGoal } from './goal';
import type { FilingStatus } from './tax';

/** Typed React Flow node variants */
export type AccountFlowNode = Node<AccountNodeData, 'accountNode'>;
export type EngineFlowNode = Node<EngineNodeData, 'engineNode'>;
export type OutputFlowNode = Node<OutputNodeData, 'outputNode'>;
export type IncomeFlowNode = Node<IncomeNodeData, 'incomeNode'>;
export type GoalFlowNode = Node<GoalNodeData, 'goalNode'>;
export type TaxFlowNode = Node<TaxNodeData, 'taxNode'>;
export type W2TaxFlowNode = Node<W2TaxNodeData, 'w2TaxNode'>;
export type GrossPayFlowNode = Node<GrossPayNodeData, 'grossPayNode'>;
export type ExpensesFlowNode = Node<ExpensesNodeData, 'expensesNode'>;
export type VariableFlowNode = Node<VariableNodeData, 'variableNode'>;
export type ChartFlowNode = Node<ChartNodeData, 'chartNode'>;

/** Union of all custom flow nodes */
export type FinanceFlowNode =
  | AccountFlowNode
  | EngineFlowNode
  | OutputFlowNode
  | IncomeFlowNode
  | GoalFlowNode
  | TaxFlowNode
  | W2TaxFlowNode
  | GrossPayFlowNode
  | ExpensesFlowNode
  | VariableFlowNode
  | ChartFlowNode;

/** Custom edge with optional animation flag */
export interface FinanceFlowEdge extends Edge {
  animated?: boolean;
  data?: {
    glowing?: boolean;
  };
}

/** Serializable flow state for persistence */
export interface FlowState {
  nodes: FinanceFlowNode[];
  edges: FinanceFlowEdge[];
}

/** Tax settings snapshot for save/load */
export interface TaxSettingsSnapshot {
  filingStatus: FilingStatus;
  stateRate: number;
  autoAllocate: boolean;
  manualOrdinaryPct: number;
  manualLtcgPct: number;
  manualTaxFreePct: number;
}

/** Goal settings snapshot for save/load */
export interface GoalSettingsSnapshot {
  inflationRate: number;
  currentAnnualIncome: number;
  ssClaimAge: number;
  monthlyExpenses?: number;
}

/** A complete saved setup (all app state) */
export interface SavedSetup {
  id: string;
  name: string;
  createdAt: number;
  data: {
    nodes: FinanceFlowNode[];
    edges: FinanceFlowEdge[];
    accounts: Account[];
    goal: RetirementGoal;
    goalSettings: GoalSettingsSnapshot;
    taxSettings: TaxSettingsSnapshot;
  };
}
