import { makeAutoObservable } from 'mobx';
import type { AccountType } from '../core/types/account';
import type { FilingStatus } from '../core/types/tax';

export interface OnboardingAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  monthlyContribution: number;
  contributionPercent: number;
}

let nextAccountId = 1;

function createBlankAccount(): OnboardingAccount {
  return {
    id: `onb-acct-${nextAccountId++}`,
    name: '',
    type: '401k',
    balance: 0,
    monthlyContribution: 0,
    contributionPercent: 0,
  };
}

export class OnboardingStore {
  // Step tracking
  currentStep = 0;
  totalSteps = 5;

  // About You
  currentAge = 30;
  retirementAge = 65;
  filingStatus: FilingStatus = 'single';

  // Income
  annualIncome = 0;
  desiredMonthlyIncome = 0;

  // Accounts
  accounts: OnboardingAccount[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // ── Navigation ──────────────────────────────────────────────

  nextStep(): void {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.totalSteps) {
      this.currentStep = step;
    }
  }

  // ── About You ───────────────────────────────────────────────

  setCurrentAge(age: number): void {
    this.currentAge = age;
  }

  setRetirementAge(age: number): void {
    this.retirementAge = age;
  }

  setFilingStatus(status: FilingStatus): void {
    this.filingStatus = status;
  }

  // ── Income ──────────────────────────────────────────────────

  setAnnualIncome(income: number): void {
    this.annualIncome = Math.max(0, income);
  }

  setDesiredMonthlyIncome(income: number): void {
    this.desiredMonthlyIncome = Math.max(0, income);
  }

  // ── Accounts ────────────────────────────────────────────────

  addAccount(): void {
    this.accounts.push(createBlankAccount());
  }

  removeAccount(id: string): void {
    this.accounts = this.accounts.filter((a) => a.id !== id);
  }

  updateAccount(id: string, updates: Partial<Omit<OnboardingAccount, 'id'>>): void {
    const account = this.accounts.find((a) => a.id === id);
    if (account) {
      Object.assign(account, updates);
    }
  }

  // ── Validation ──────────────────────────────────────────────

  get isAboutYouValid(): boolean {
    return (
      this.currentAge >= 18 &&
      this.currentAge <= 100 &&
      this.retirementAge > this.currentAge &&
      this.retirementAge <= 100
    );
  }

  get isIncomeValid(): boolean {
    return this.annualIncome > 0 && this.desiredMonthlyIncome > 0;
  }

  get isAccountsValid(): boolean {
    // Accounts step is always valid — user might have zero accounts
    return this.accounts.every(
      (a) => a.name.trim().length > 0 && a.balance >= 0,
    );
  }

  get canProceed(): boolean {
    switch (this.currentStep) {
      case 0: return true; // Welcome
      case 1: return this.isAboutYouValid;
      case 2: return this.isIncomeValid;
      case 3: return this.isAccountsValid;
      case 4: return true; // Review
      default: return false;
    }
  }
}
