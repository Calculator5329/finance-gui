import type {
  SavedSetup,
  GoalSettingsSnapshot,
  TaxSettingsSnapshot,
  FinanceFlowNode,
  FinanceFlowEdge,
} from '../core/types/flow';
import type { Account } from '../core/types/account';
import type { RetirementGoal } from '../core/types/goal';

/**
 * Create a SavedSetup snapshot from the current app state.
 */
export function createSetupSnapshot(
  name: string,
  nodes: FinanceFlowNode[],
  edges: FinanceFlowEdge[],
  accounts: Account[],
  goal: RetirementGoal,
  goalSettings: GoalSettingsSnapshot,
  taxSettings: TaxSettingsSnapshot,
): SavedSetup {
  // Use JSON round-trip instead of structuredClone to strip MobX observable wrappers
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  return {
    id: `setup-${Date.now()}`,
    name,
    createdAt: Date.now(),
    data: {
      nodes: clone(nodes),
      edges: clone(edges),
      accounts: clone(accounts),
      goal: clone(goal),
      goalSettings: clone(goalSettings),
      taxSettings: clone(taxSettings),
    },
  };
}

/**
 * Serialize a SavedSetup to a downloadable JSON string.
 */
export function exportSetupToJSON(setup: SavedSetup): string {
  return JSON.stringify(setup, null, 2);
}

/**
 * Parse a JSON string into a SavedSetup. Throws on invalid data.
 */
export function importSetupFromJSON(json: string): SavedSetup {
  const parsed = JSON.parse(json);
  if (!parsed?.id || !parsed?.name || !parsed?.data) {
    throw new Error('Invalid setup file: missing required fields');
  }
  if (!Array.isArray(parsed.data.nodes) || !Array.isArray(parsed.data.edges)) {
    throw new Error('Invalid setup file: missing nodes or edges');
  }
  if (!Array.isArray(parsed.data.accounts) || !parsed.data.goal) {
    throw new Error('Invalid setup file: missing accounts or goal');
  }
  return parsed as SavedSetup;
}
