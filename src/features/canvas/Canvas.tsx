import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnDrop,
  type ReactFlowInstance,
} from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { useFlowStore, useAccountStore } from '../../stores/RootStore';
import { AccountNode } from './nodes/AccountNode';
import { EngineNode } from './nodes/EngineNode';
import { OutputNode } from './nodes/OutputNode';
import { IncomeNode } from './nodes/IncomeNode';
import { GoalNode } from './nodes/GoalNode';
import { TaxNode } from './nodes/TaxNode';
import { W2TaxNode } from './nodes/W2TaxNode';
import { GrossPayNode } from './nodes/GrossPayNode';
import { ExpensesNode } from './nodes/ExpensesNode';
import { VariableNode } from './nodes/VariableNode';
import { GlowEdge } from './edges/GlowEdge';
import type { FinanceFlowNode } from '../../core/types/flow';
import type { FinanceNodeType } from '../../core/types/node';
import type { AccountType } from '../../core/types/account';
import { ACCOUNT_TYPE_LABELS } from '../../core/types/account';
import type { IncomeSourceType, OutputMetric } from '../../core/types/node';

const nodeTypes = {
  accountNode: AccountNode,
  engineNode: EngineNode,
  outputNode: OutputNode,
  incomeNode: IncomeNode,
  goalNode: GoalNode,
  taxNode: TaxNode,
  w2TaxNode: W2TaxNode,
  grossPayNode: GrossPayNode,
  expensesNode: ExpensesNode,
  variableNode: VariableNode,
};

const edgeTypes = {
  glowEdge: GlowEdge,
};

const defaultEdgeOptions = {
  type: 'glowEdge',
  animated: true,
};

/** Fallback defaults when no palette metadata is available (e.g. legacy drag data) */
const DEFAULT_NODE_DATA: Record<FinanceNodeType, Record<string, unknown>> = {
  accountNode: { label: 'New Account', accountId: '' },
  engineNode: { label: 'Retirement Plan Engine' },
  outputNode: { label: 'Output', metric: 'net_worth' },
  incomeNode: { label: 'Income', sourceType: 'social_security', monthlyAmount: 0, autoEstimate: true },
  goalNode: { label: 'Target Age', goalId: 'goal-retirement-default' },
  taxNode: { label: 'Tax Calculator', filingStatus: 'married_joint', stateRate: 0.05 },
  w2TaxNode: { label: 'W-2 Income Tax' },
  grossPayNode: { label: 'Gross Pay' },
  expensesNode: { label: 'Expenses' },
  variableNode: { label: 'Inflation Rate', key: 'inflationRate', value: 3, suffix: '%', min: 0, max: 10, step: 0.1 },
};

/** Source type label mapping for income nodes */
const INCOME_SOURCE_LABELS: Record<IncomeSourceType, string> = {
  social_security: 'Social Security',
  pension_income: 'Pension',
  '401k_drawdown': '401(k) Drawdown',
  roth_drawdown: 'Roth Drawdown',
};

/** Output metric label mapping */
const OUTPUT_METRIC_LABELS: Record<OutputMetric, string> = {
  net_worth: 'Net Worth',
  goal_status: 'Goal Status',
  monthly_income: 'Gross Monthly Income',
  net_monthly_income: 'Net Monthly Income',
  take_home_pay: 'Take-Home Pay',
  disposable_income: 'Disposable Income',
};

interface PalettePayload {
  type: FinanceNodeType;
  label: string;
  defaultData: Record<string, unknown>;
}

export const Canvas = observer(function Canvas() {
  const flowStore = useFlowStore();
  const accountStore = useAccountStore();
  const reactFlowInstance = useRef<ReactFlowInstance<FinanceFlowNode> | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => [...flowStore.nodes], [flowStore.nodes]);
  const edges = useMemo(() => [...flowStore.edges], [flowStore.edges]);

  const onInit = useCallback((instance: ReactFlowInstance<FinanceFlowNode>) => {
    reactFlowInstance.current = instance;
  }, []);

  /**
   * Build the correct node data based on node type and palette metadata.
   * For account nodes, auto-creates an account in AccountStore.
   */
  const buildNodeData = useCallback(
    (nodeType: FinanceNodeType, paletteLabel: string, paletteExtra: Record<string, unknown>): Record<string, unknown> => {
      switch (nodeType) {
        case 'accountNode': {
          const accountType = (paletteExtra.accountType as AccountType) || '401k';
          const label = paletteLabel || ACCOUNT_TYPE_LABELS[accountType] || 'New Account';
          // Auto-create account in the store so the node is immediately linked
          const newAccount = accountStore.addAccount(accountType, label, '');
          return { label, accountId: newAccount.id };
        }
        case 'incomeNode': {
          const sourceType = (paletteExtra.sourceType as IncomeSourceType) || 'social_security';
          const label = paletteLabel || INCOME_SOURCE_LABELS[sourceType] || 'Income';
          return { label, sourceType, monthlyAmount: 0, autoEstimate: sourceType === 'social_security' };
        }
        case 'outputNode': {
          const metric = (paletteExtra.metric as OutputMetric) || 'net_worth';
          const label = paletteLabel || OUTPUT_METRIC_LABELS[metric] || 'Output';
          return { label, metric };
        }
        case 'goalNode': {
          const goalLabel = (paletteExtra.goalLabel as string) || paletteLabel || 'Target Age';
          return { label: goalLabel, goalId: 'goal-retirement-default' };
        }
        case 'variableNode': {
          const key = (paletteExtra.key as string) || 'inflationRate';
          // Currently only inflation rate; can be extended for other variables
          return { label: paletteLabel || 'Inflation Rate', key, value: 3, suffix: '%', min: 0, max: 10, step: 0.1 };
        }
        default:
          return DEFAULT_NODE_DATA[nodeType] || { label: paletteLabel || nodeType };
      }
    },
    [accountStore],
  );

  const onDrop: OnDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData || !reactFlowInstance.current || !reactFlowWrapper.current) return;

      // Parse the palette payload (JSON with type, label, defaultData)
      // Fall back to legacy format (plain node type string)
      let nodeType: FinanceNodeType;
      let paletteLabel = '';
      let paletteExtra: Record<string, unknown> = {};

      try {
        const parsed = JSON.parse(rawData) as PalettePayload;
        nodeType = parsed.type;
        paletteLabel = parsed.label || '';
        paletteExtra = parsed.defaultData || {};
      } catch {
        // Legacy format: raw string is just the node type
        nodeType = rawData as FinanceNodeType;
      }

      if (!nodeType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const data = buildNodeData(nodeType, paletteLabel, paletteExtra);
      flowStore.addNode(nodeType, position, data);
    },
    [flowStore, buildNodeData],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FinanceFlowNode) => {
      flowStore.selectNode(node.id);
    },
    [flowStore],
  );

  const onPaneClick = useCallback(() => {
    flowStore.selectNode(null);
  }, [flowStore]);

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={flowStore.onNodesChange}
        onEdgesChange={flowStore.onEdgesChange}
        onConnect={flowStore.onConnect}
        isValidConnection={flowStore.isValidConnection}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950"
        deleteKeyCode="Delete"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#27272a"
        />
        <Controls
          position="top-right"
          showInteractive={false}
          className="!shadow-none"
        />
        <MiniMap
          position="bottom-right"
          nodeColor="#3f3f46"
          maskColor="rgba(9, 9, 11, 0.7)"
          className="!shadow-none"
        />
      </ReactFlow>
    </div>
  );
});
