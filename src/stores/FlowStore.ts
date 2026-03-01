import { makeAutoObservable, reaction } from 'mobx';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type { FinanceFlowNode, FinanceFlowEdge } from '../core/types/flow';
import type { FinanceNodeType } from '../core/types/node';
import type { Account } from '../core/types/account';
import { ACCOUNT_TYPE_LABELS } from '../core/types/account';
import { save, load } from '../services/persistence';

/**
 * Allowlist of valid source → target node type connections.
 * Defined here (store layer) so it can be enforced by both the interactive
 * canvas guard and programmatic edge insertion.
 */
const ALLOWED_CONNECTIONS: Record<string, Set<string>> = {
  grossPayNode: new Set(['w2TaxNode', 'engineNode']),
  w2TaxNode: new Set(['outputNode', 'expensesNode']),
  expensesNode: new Set(['outputNode', 'engineNode']),
  outputNode: new Set(['outputNode', 'accountNode', 'taxNode', 'chartNode']),
  accountNode: new Set(['engineNode']),
  incomeNode: new Set(['engineNode']),
  goalNode: new Set(['engineNode']),
  variableNode: new Set(['engineNode']),
  engineNode: new Set(['outputNode', 'chartNode']),
  taxNode: new Set(['outputNode']),
};

const NODES_KEY = 'flow-nodes';
const EDGES_KEY = 'flow-edges';

export class FlowStore {
  nodes: FinanceFlowNode[] = [];
  edges: FinanceFlowEdge[] = [];
  selectedNodeId: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    this.nodes = load<FinanceFlowNode[]>(NODES_KEY, []);
    this.edges = load<FinanceFlowEdge[]>(EDGES_KEY, []);

    // Persist on changes
    reaction(
      () => JSON.stringify(this.nodes.map((n) => ({ ...n, selected: undefined }))),
      () => save(NODES_KEY, this.nodes),
    );

    reaction(
      () => JSON.stringify(this.edges),
      () => save(EDGES_KEY, this.edges),
    );
  }

  get hasNodes(): boolean {
    return this.nodes.length > 0;
  }

  get selectedNode(): FinanceFlowNode | undefined {
    if (!this.selectedNodeId) return undefined;
    return this.nodes.find((n) => n.id === this.selectedNodeId);
  }

  setNodes(nodes: FinanceFlowNode[]): void {
    this.nodes = nodes;
  }

  setEdges(edges: FinanceFlowEdge[]): void {
    this.edges = edges;
  }

  onNodesChange(changes: NodeChange<FinanceFlowNode>[]): void {
    this.nodes = applyNodeChanges(changes, this.nodes) as FinanceFlowNode[];

    // Track selection changes
    for (const change of changes) {
      if (change.type === 'select') {
        const selectChange = change as { id: string; type: 'select'; selected: boolean };
        if (selectChange.selected) {
          this.selectedNodeId = selectChange.id;
        } else if (this.selectedNodeId === selectChange.id) {
          this.selectedNodeId = null;
        }
      }
    }
  }

  onEdgesChange(changes: EdgeChange<FinanceFlowEdge>[]): void {
    this.edges = applyEdgeChanges(changes, this.edges) as FinanceFlowEdge[];
  }

  /**
   * Returns true when the proposed connection is allowed by the type allowlist,
   * is not a self-loop, and is not a duplicate of an existing edge.
   *
   * Accepts both `Connection` (from drag-connect) and `FinanceFlowEdge`
   * (from programmatic insert / ReactFlow's IsValidConnection callback).
   */
  isValidConnection(connection: Connection | FinanceFlowEdge): boolean {
    if (connection.source === connection.target) return false;

    const sourceNode = this.nodes.find((n) => n.id === connection.source);
    const targetNode = this.nodes.find((n) => n.id === connection.target);
    if (!sourceNode?.type || !targetNode?.type) return false;

    const isDuplicate = this.edges.some(
      (e) =>
        e.source === connection.source &&
        e.target === connection.target &&
        (e.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
        (e.targetHandle ?? null) === (connection.targetHandle ?? null),
    );
    if (isDuplicate) return false;

    const allowed = ALLOWED_CONNECTIONS[sourceNode.type];
    return allowed ? allowed.has(targetNode.type) : false;
  }

  onConnect(connection: Connection): void {
    if (!this.isValidConnection(connection)) return;
    this.edges = addEdge(
      { ...connection, type: 'glowEdge', animated: true },
      this.edges,
    ) as FinanceFlowEdge[];
  }

  addNode(
    type: FinanceNodeType,
    position: { x: number; y: number },
    data: Record<string, unknown>,
  ): string {
    const id = `${type}-${Date.now()}`;
    const newNode: FinanceFlowNode = {
      id,
      type,
      position,
      data: data as FinanceFlowNode['data'],
    };
    this.nodes = [...this.nodes, newNode];
    return id;
  }

  removeNode(id: string): void {
    this.nodes = this.nodes.filter((n) => n.id !== id);
    this.edges = this.edges.filter((e) => e.source !== id && e.target !== id);
    if (this.selectedNodeId === id) {
      this.selectedNodeId = null;
    }
  }

  updateNodeData(id: string, data: Partial<Record<string, unknown>>): void {
    this.nodes = this.nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
    );
  }

  selectNode(id: string | null): void {
    this.selectedNodeId = id;
  }

  /**
   * Build a custom flow where the hardcoded default account nodes are replaced
   * by nodes generated from the provided accounts.  Sets nodes and edges
   * directly (force-replaces any existing state).
   *
   * @param accounts    - Accounts to create nodes for.
   * @param defaultNodes - The full default node list (used as the structural base).
   * @param defaultEdges - The full default edge list (used as the structural base).
   */
  buildFlowFromAccounts(
    accounts: Account[],
    defaultNodes: FinanceFlowNode[],
    defaultEdges: FinanceFlowEdge[],
  ): void {
    const STATIC_ACCOUNT_NODE_IDS = new Set(['node-savings', 'node-brokerage', 'node-growth', 'node-roth', 'node-index', 'node-yolo']);
    const isStaticAccountEdge = (e: FinanceFlowEdge) =>
      STATIC_ACCOUNT_NODE_IDS.has(e.source) || STATIC_ACCOUNT_NODE_IDS.has(e.target);

    const ACCT_COL_X = 1040;
    const ACCT_COL_START_Y = 30;
    const ACCT_SPACING = 140;

    const baseNodes = defaultNodes.filter((n) => !STATIC_ACCOUNT_NODE_IDS.has(n.id));
    const baseEdges = defaultEdges.filter((e) => !isStaticAccountEdge(e));

    const accountNodes: FinanceFlowNode[] = accounts.map((acct, i) => ({
      id: `node-acct-${i}`,
      type: 'accountNode' as const,
      position: { x: ACCT_COL_X, y: ACCT_COL_START_Y + i * ACCT_SPACING },
      data: {
        label: acct.name || ACCOUNT_TYPE_LABELS[acct.type],
        accountId: acct.id,
      },
    }));

    const accountEdges: FinanceFlowEdge[] = accounts.flatMap((_acct, i) => [
      { id: `e-disp-acct-${i}`, source: 'node-disposable', target: `node-acct-${i}`, type: 'glowEdge', animated: true },
      { id: `e-acct-${i}-eng`, source: `node-acct-${i}`, target: 'node-engine', type: 'glowEdge', animated: true },
    ]);

    const nextAcctY = ACCT_COL_START_Y + accounts.length * ACCT_SPACING;
    const adjustedBaseNodes = baseNodes.map((node) =>
      node.id === 'node-ss'
        ? { ...node, position: { ...node.position, x: ACCT_COL_X, y: nextAcctY } }
        : node,
    );

    this.nodes = [...accountNodes, ...adjustedBaseNodes];
    this.edges = [...accountEdges, ...baseEdges];
  }

  /**
   * Initialize with default flow if no persisted state exists.
   */
  initializeDefaultFlow(nodes: FinanceFlowNode[], edges: FinanceFlowEdge[]): void {
    if (!this.hasNodes) {
      this.nodes = nodes;
      this.edges = edges;
      return;
    }

    this.ensureRequiredDefaultPath(nodes, edges);
  }

  /**
   * Backfill required default nodes/edges for previously persisted flows so
   * users see the current gross -> tax -> net pipeline without resetting.
   */
  private ensureRequiredDefaultPath(defaultNodes: FinanceFlowNode[], defaultEdges: FinanceFlowEdge[]): void {
    const defaultNodeById = new Map(defaultNodes.map((node) => [node.id, node]));
    const existingNodeIds = new Set(this.nodes.map((node) => node.id));
    const requiredNodeIds = [
      'node-networth', 'node-goalstatus', 'node-grossincome', 'node-tax', 'node-netincome', 'node-w2tax',
      'node-grosspay', 'node-takehome', 'node-expenses', 'node-disposable',
    ];

    const nodesToAdd = requiredNodeIds
      .filter((id) => !existingNodeIds.has(id))
      .map((id) => defaultNodeById.get(id))
      .filter((node): node is FinanceFlowNode => Boolean(node));

    if (nodesToAdd.length > 0) {
      this.nodes = [...this.nodes, ...nodesToAdd];
    }

    const engineNode = this.nodes.find((node) => node.type === 'engineNode');
    const netWorthNode = this.nodes.find((node) => node.type === 'outputNode' && node.data?.metric === 'net_worth');
    const goalStatusNode = this.nodes.find((node) => node.type === 'outputNode' && node.data?.metric === 'goal_status');
    const grossIncomeNode = this.nodes.find((node) => node.type === 'outputNode' && node.data?.metric === 'monthly_income');
    const taxNode = this.nodes.find((node) => node.type === 'taxNode');
    const w2TaxNode = this.nodes.find((node) => node.type === 'w2TaxNode');
    const grossPayNode = this.nodes.find((node) => node.type === 'grossPayNode');
    const takeHomeNode = this.nodes.find((node) => node.type === 'outputNode' && node.data?.metric === 'take_home_pay');
    const expensesNode = this.nodes.find((node) => node.type === 'expensesNode');
    const disposableNode = this.nodes.find((node) => node.type === 'outputNode' && node.data?.metric === 'disposable_income');
    const netIncomeNode = this.nodes.find(
      (node) => node.type === 'outputNode' && node.data?.metric === 'net_monthly_income',
    );

    const hasEdge = (source?: string, target?: string): boolean => {
      if (!source || !target) return true;
      return this.edges.some((edge) => edge.source === source && edge.target === target);
    };

    const defaultEdgeById = new Map(defaultEdges.map((edge) => [edge.id, edge]));
    const edgeCandidates: Array<{ id: string; source?: string; target?: string }> = [
      // Income pipeline
      { id: 'e-gp-w2', source: grossPayNode?.id, target: w2TaxNode?.id },
      { id: 'e-w2-th', source: w2TaxNode?.id, target: takeHomeNode?.id },
      { id: 'e-th-disp', source: takeHomeNode?.id, target: disposableNode?.id },
      { id: 'e-exp-disp', source: expensesNode?.id, target: disposableNode?.id },
      // Engine outputs
      { id: 'e-eng-nw', source: engineNode?.id, target: netWorthNode?.id },
      { id: 'e-eng-goal', source: engineNode?.id, target: goalStatusNode?.id },
      { id: 'e-eng-gross', source: engineNode?.id, target: grossIncomeNode?.id },
      { id: 'e-gross-tax', source: grossIncomeNode?.id, target: taxNode?.id },
      { id: 'e-tax-net', source: taxNode?.id, target: netIncomeNode?.id },
    ];

    const edgesToAdd: FinanceFlowEdge[] = [];
    for (const candidate of edgeCandidates) {
      if (!candidate.source || !candidate.target || hasEdge(candidate.source, candidate.target)) {
        continue;
      }
      const defaultEdge = defaultEdgeById.get(candidate.id);
      if (!defaultEdge) continue;
      edgesToAdd.push({
        ...defaultEdge,
        source: candidate.source,
        target: candidate.target,
      });
    }

    if (edgesToAdd.length > 0) {
      this.edges = [...this.edges, ...edgesToAdd];
    }
  }
}
