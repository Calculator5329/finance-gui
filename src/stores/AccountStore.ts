import { makeAutoObservable, reaction } from 'mobx';
import type { Account, AccountType } from '../core/types/account';
import { calcNetWorth } from '../services/financialCalc';
import { save, load } from '../services/persistence';

const STORAGE_KEY = 'accounts';

let nextId = 1;
function generateId(): string {
  return `account-${Date.now()}-${nextId++}`;
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-growth-default',
    name: 'Growth Brokerage',
    type: 'brokerage',
    provider: 'Fidelity',
    balance: 60000,
    monthlyContribution: 1800,
    contributionPercent: 57,
    annualReturn: 0.15,
    vestingPercent: 100,
    maxBalance: 0,
    overflowAccountId: '',
  },
  {
    id: 'acc-roth-default',
    name: 'Roth IRA',
    type: 'roth_ira',
    provider: 'Fidelity',
    balance: 10000,
    monthlyContribution: 625,
    contributionPercent: 20,
    annualReturn: 0.12,
    vestingPercent: 100,
    maxBalance: 0,
    overflowAccountId: '',
  },
  {
    id: 'acc-index-default',
    name: 'Index Portfolio',
    type: 'brokerage',
    provider: 'Vanguard',
    balance: 7000,
    monthlyContribution: 425,
    contributionPercent: 13,
    annualReturn: 0.10,
    vestingPercent: 100,
    maxBalance: 0,
    overflowAccountId: '',
  },
  {
    id: 'acc-savings-default',
    name: 'Savings',
    type: 'savings',
    provider: 'Ally Bank',
    balance: 500,
    monthlyContribution: 200,
    contributionPercent: 6,
    annualReturn: 0.045,
    vestingPercent: 100,
    maxBalance: 0,
    overflowAccountId: '',
  },
  {
    id: 'acc-yolo-default',
    name: 'YOLO',
    type: 'brokerage',
    provider: 'Robinhood',
    balance: 4000,
    monthlyContribution: 100,
    contributionPercent: 4,
    annualReturn: 0.20,
    vestingPercent: 100,
    maxBalance: 0,
    overflowAccountId: '',
  },
];

function normalizeLoadedAccounts(accounts: Account[]): Account[] {
  return accounts.map((account) => {
    let normalized = { ...account };
    // Migration: add contributionPercent for legacy accounts that lack it
    if ((normalized as any).contributionPercent === undefined || (normalized as any).contributionPercent === null) {
      normalized.contributionPercent = 0;
    }
    // Migration: add maxBalance and overflowAccountId for legacy accounts
    if ((normalized as any).maxBalance === undefined || (normalized as any).maxBalance === null) {
      normalized.maxBalance = 0;
    }
    if ((normalized as any).overflowAccountId === undefined || (normalized as any).overflowAccountId === null) {
      normalized.overflowAccountId = '';
    }
    return normalized;
  });
}

export class AccountStore {
  accounts: Account[] = [];

  constructor() {
    makeAutoObservable(this);
    this.accounts = normalizeLoadedAccounts(load<Account[]>(STORAGE_KEY, DEFAULT_ACCOUNTS));

    // Auto-persist on changes
    reaction(
      () => JSON.stringify(this.accounts),
      () => save(STORAGE_KEY, this.accounts),
    );
  }

  get netWorth(): number {
    return calcNetWorth(this.accounts);
  }

  get totalMonthlyContributions(): number {
    return this.accounts.reduce((sum, a) => sum + a.monthlyContribution, 0);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  addAccount(type: AccountType, name: string, provider: string): Account {
    const isSavings = type === 'savings';
    const account: Account = {
      id: generateId(),
      name,
      type,
      provider,
      balance: 0,
      monthlyContribution: 0,
      contributionPercent: 0,
      annualReturn: isSavings ? 0.03 : 0.07,
      vestingPercent: 100,
      maxBalance: 0,
      overflowAccountId: '',
    };
    this.accounts.push(account);
    return account;
  }

  updateAccount(id: string, updates: Partial<Omit<Account, 'id'>>): void {
    const index = this.accounts.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.accounts[index] = { ...this.accounts[index], ...updates };
    }
  }

  removeAccount(id: string): void {
    this.accounts = this.accounts.filter((a) => a.id !== id);
  }

  /** Replace all accounts wholesale (used by setup restore) */
  setAccounts(accounts: Account[]): void {
    this.accounts = accounts;
  }
}
