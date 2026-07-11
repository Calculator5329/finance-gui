import { createContext, useContext } from 'react';
import { makeAutoObservable, reaction } from 'mobx';
import { AccountStore } from './AccountStore';
import { GoalStore } from './GoalStore';
import { FlowStore } from './FlowStore';
import { TaxStore } from './TaxStore';
import type { OnboardingStore } from './OnboardingStore';
import { save, load } from '../services/persistence';
import { createSetupSnapshot, importSetupFromJSON, exportSetupToJSON } from '../services/setupService';
import { HistoryStack } from '../services/history';
import type {
  SavedSetup,
  FinanceFlowNode,
  FinanceFlowEdge,
  GoalSettingsSnapshot,
  TaxSettingsSnapshot,
} from '../core/types/flow';
import type { Account } from '../core/types/account';
import type { RetirementGoal } from '../core/types/goal';

const SETUPS_KEY = 'saved-setups';

/**
 * Full canonical app state captured for undo/redo. Mirrors the `data` payload of
 * a SavedSetup so capture/restore reuse the same battle-tested serialization
 * (nodes, edges, accounts, goal, and goal/tax settings).
 */
export interface AppSnapshot {
  nodes: FinanceFlowNode[];
  edges: FinanceFlowEdge[];
  accounts: Account[];
  goal: RetirementGoal;
  goalSettings: GoalSettingsSnapshot;
  taxSettings: TaxSettingsSnapshot;
}

/** Max undoable steps retained. */
const HISTORY_LIMIT = 50;
/** Rapid edits within this window (ms) collapse into a single undo step. */
const HISTORY_COALESCE_MS = 500;

/** JSON round-trip clone that also strips MobX observable wrappers. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class RootStore {
  accountStore: AccountStore;
  goalStore: GoalStore;
  flowStore: FlowStore;
  taxStore: TaxStore;

  /** User-saved setups */
  savedSetups: SavedSetup[] = [];

  /** Reactive flags so undo/redo UI (buttons) enable/disable correctly. */
  canUndo = false;
  canRedo = false;

  /**
   * Bounded undo/redo timeline over whole-app snapshots. Declared (not
   * initialized) so it stays out of `makeAutoObservable` — the stack manages its
   * own internal state and must not be turned into a deep MobX observable.
   * Assigned in the constructor after `makeAutoObservable`.
   */
  private declare history: HistoryStack<AppSnapshot>;
  /**
   * Signature of the snapshot the timeline currently points at. Used to
   * distinguish genuine user edits (record them) from the state echo produced
   * by applying an undo/redo (ignore it, else undo/redo would corrupt history).
   * Kept non-observable via `declare` for the same reason as `history`.
   */
  private declare currentSignature: string;

  constructor() {
    this.accountStore = new AccountStore();
    this.goalStore = new GoalStore(this.accountStore);
    this.flowStore = new FlowStore();
    this.taxStore = new TaxStore(this.goalStore, this.accountStore);

    // Wire GoalStore -> TaxStore (late binding to break circular dependency)
    this.goalStore.setTaxSettings(this.taxStore);

    // Load persisted setups
    this.savedSetups = load<SavedSetup[]>(SETUPS_KEY, []);

    makeAutoObservable(this, {
      accountStore: false,
      goalStore: false,
      flowStore: false,
      taxStore: false,
    });

    // Auto-persist saved setups
    reaction(
      () => JSON.stringify(this.savedSetups),
      () => save(SETUPS_KEY, this.savedSetups),
    );

    // Initialize the (non-observable) undo/redo timeline after makeAutoObservable
    // so MobX does not deep-observe the HistoryStack's internals.
    this.history = new HistoryStack<AppSnapshot>({
      limit: HISTORY_LIMIT,
      coalesceMs: HISTORY_COALESCE_MS,
    });

    // Seed the undo timeline with the initial (loaded) state as the baseline,
    // then record every subsequent canonical edit.
    this.currentSignature = this.snapshotSignature();
    this.history.push(this.captureSnapshot());
    this.syncHistoryFlags();

    // Record edits. The `delay` batches a burst of changes (drags, typing) and,
    // combined with coalescing in HistoryStack, keeps them to one undo step.
    reaction(
      () => this.snapshotSignature(),
      (signature) => {
        // Ignore the state echo of an undo/redo we just applied.
        if (signature === this.currentSignature) return;
        this.history.push(this.captureSnapshot(), 'edit');
        this.currentSignature = signature;
        this.syncHistoryFlags();
      },
      { delay: 250 },
    );
  }

  // ── Undo / redo ───────────────────────────────────────────────

  /** Revert to the previous snapshot on the timeline, if any. */
  undo(): void {
    const snapshot = this.history.undo();
    if (!snapshot) return;
    this.applySnapshot(snapshot);
    this.syncHistoryFlags();
  }

  /** Re-apply the next snapshot on the timeline, if any. */
  redo(): void {
    const snapshot = this.history.redo();
    if (!snapshot) return;
    this.applySnapshot(snapshot);
    this.syncHistoryFlags();
  }

  private syncHistoryFlags(): void {
    this.canUndo = this.history.canUndo;
    this.canRedo = this.history.canRedo;
  }

  /**
   * Normalized signature of the current canonical state. `selected` is stripped
   * from nodes so pure selection changes are not treated as undoable edits and
   * do not perturb the signature.
   */
  private snapshotSignature(): string {
    return JSON.stringify(this.rawSnapshot());
  }

  /** Live (uncloned) canonical state, with node selection normalized away. */
  private rawSnapshot(): AppSnapshot {
    return {
      nodes: this.flowStore.nodes.map((n) => ({ ...n, selected: undefined })),
      edges: this.flowStore.edges,
      accounts: this.accountStore.accounts,
      goal: this.goalStore.goal,
      goalSettings: {
        inflationRate: this.goalStore.inflationRate,
        currentAnnualIncome: this.goalStore.currentAnnualIncome,
        ssClaimAge: this.goalStore.ssClaimAge,
        monthlyExpenses: this.goalStore.monthlyExpenses,
      },
      taxSettings: {
        filingStatus: this.taxStore.filingStatus,
        stateRate: this.taxStore.stateRate,
        autoAllocate: this.taxStore.autoAllocate,
        manualOrdinaryPct: this.taxStore.manualOrdinaryPct,
        manualLtcgPct: this.taxStore.manualLtcgPct,
        manualTaxFreePct: this.taxStore.manualTaxFreePct,
      },
    };
  }

  /** Deep, MobX-free clone of the current state for storage on the timeline. */
  private captureSnapshot(): AppSnapshot {
    return clone(this.rawSnapshot());
  }

  /**
   * Restore a snapshot into the stores. Uses the same restore path as
   * loadSetup so persisted state stays consistent. `currentSignature` is set to
   * the restored state's signature so the recorder reaction ignores the echo.
   */
  private applySnapshot(snapshot: AppSnapshot): void {
    const data = clone(snapshot);
    this.flowStore.setNodes(data.nodes);
    this.flowStore.setEdges(data.edges);
    this.flowStore.selectNode(null);
    this.accountStore.setAccounts(data.accounts);
    this.goalStore.restoreState(data.goal, data.goalSettings);
    this.taxStore.restoreState(data.taxSettings);
    this.currentSignature = this.snapshotSignature();
  }

  /**
   * Complete the onboarding wizard: populate stores from wizard data and build
   * a custom flow layout with the user's actual accounts.
   *
   * @param onboarding   - Completed onboarding wizard state.
   * @param defaultNodes - Base node list to derive the flow layout from.
   * @param defaultEdges - Base edge list to derive the flow layout from.
   */
  completeOnboarding(
    onboarding: OnboardingStore,
    defaultNodes: FinanceFlowNode[],
    defaultEdges: FinanceFlowEdge[],
  ): void {
    // Clear existing accounts and populate from onboarding
    const existingIds = this.accountStore.accounts.map((a) => a.id);
    for (const id of existingIds) {
      this.accountStore.removeAccount(id);
    }

    const numAccounts = onboarding.accounts.length;
    for (let i = 0; i < numAccounts; i++) {
      const acct = onboarding.accounts[i];
      const created = this.accountStore.addAccount(acct.type, acct.name, '');
      const evenPct = numAccounts > 0 ? Math.floor(100 / numAccounts) : 0;
      const pct = i === numAccounts - 1 ? 100 - evenPct * (numAccounts - 1) : evenPct;
      this.accountStore.updateAccount(created.id, { balance: acct.balance, contributionPercent: pct });
    }

    // Populate goal + income
    this.goalStore.updateGoal({
      currentAge: onboarding.currentAge,
      targetAge: onboarding.retirementAge,
      monthlySpending: onboarding.desiredMonthlyIncome,
    });
    this.goalStore.setCurrentAnnualIncome(onboarding.annualIncome);

    // Populate tax settings
    this.taxStore.setFilingStatus(onboarding.filingStatus);

    // Build flow with the created accounts
    const createdAccounts = this.accountStore.accounts;
    this.flowStore.buildFlowFromAccounts(createdAccounts, defaultNodes, defaultEdges);
  }

  /** Save the current app state as a named setup */
  saveSetup(name: string): void {
    const setup = createSetupSnapshot(
      name,
      this.flowStore.nodes,
      this.flowStore.edges,
      this.accountStore.accounts,
      this.goalStore.goal,
      {
        inflationRate: this.goalStore.inflationRate,
        currentAnnualIncome: this.goalStore.currentAnnualIncome,
        ssClaimAge: this.goalStore.ssClaimAge,
        monthlyExpenses: this.goalStore.monthlyExpenses,
      },
      {
        filingStatus: this.taxStore.filingStatus,
        stateRate: this.taxStore.stateRate,
        autoAllocate: this.taxStore.autoAllocate,
        manualOrdinaryPct: this.taxStore.manualOrdinaryPct,
        manualLtcgPct: this.taxStore.manualLtcgPct,
        manualTaxFreePct: this.taxStore.manualTaxFreePct,
      },
    );
    this.savedSetups = [...this.savedSetups, setup];
  }

  /** Load a saved setup, replacing all current state */
  loadSetup(id: string): void {
    const setup = this.savedSetups.find((s) => s.id === id);
    if (!setup) return;

    const { data } = setup;
    this.flowStore.setNodes(data.nodes);
    this.flowStore.setEdges(data.edges);
    this.flowStore.selectNode(null);
    this.accountStore.setAccounts(data.accounts);
    this.goalStore.restoreState(data.goal, data.goalSettings);
    this.taxStore.restoreState(data.taxSettings);
  }

  /** Delete a saved setup */
  deleteSetup(id: string): void {
    this.savedSetups = this.savedSetups.filter((s) => s.id !== id);
  }

  /** Export a setup as downloadable JSON file */
  exportSetup(id: string): void {
    const setup = this.savedSetups.find((s) => s.id === id);
    if (!setup) return;

    const json = exportSetupToJSON(setup);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setup.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Import a setup from JSON string */
  importSetup(json: string): void {
    const setup = importSetupFromJSON(json);
    // Give it a new id to avoid collisions
    setup.id = `setup-${Date.now()}`;
    this.savedSetups = [...this.savedSetups, setup];
  }
}

// Singleton instance
const rootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

export function useStore(): RootStore {
  return useContext(StoreContext);
}

export function useAccountStore(): AccountStore {
  return useStore().accountStore;
}

export function useGoalStore(): GoalStore {
  return useStore().goalStore;
}

export function useFlowStore(): FlowStore {
  return useStore().flowStore;
}

export function useTaxStore(): TaxStore {
  return useStore().taxStore;
}

export { rootStore };
