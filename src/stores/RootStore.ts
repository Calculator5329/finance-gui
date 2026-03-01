import { createContext, useContext } from 'react';
import { makeAutoObservable, reaction } from 'mobx';
import { AccountStore } from './AccountStore';
import { GoalStore } from './GoalStore';
import { FlowStore } from './FlowStore';
import { TaxStore } from './TaxStore';
import type { OnboardingStore } from './OnboardingStore';
import { save, load } from '../services/persistence';
import { createSetupSnapshot, importSetupFromJSON, exportSetupToJSON } from '../services/setupService';
import type { SavedSetup, FinanceFlowNode, FinanceFlowEdge } from '../core/types/flow';

const SETUPS_KEY = 'saved-setups';

export class RootStore {
  accountStore: AccountStore;
  goalStore: GoalStore;
  flowStore: FlowStore;
  taxStore: TaxStore;

  /** User-saved setups */
  savedSetups: SavedSetup[] = [];

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
