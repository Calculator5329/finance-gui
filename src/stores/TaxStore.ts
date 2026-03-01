import { makeAutoObservable, reaction } from 'mobx';
import type { FilingStatus } from '../core/types/tax';
import { calcRetirementTax, type TaxBreakdown, type IncomeAllocation } from '../services/taxCalc';
import { save, load } from '../services/persistence';
import type { GoalStore } from './GoalStore';
import type { AccountStore } from './AccountStore';
import type { AccountType } from '../core/types/account';
import { calcFutureValue, getNominalReturn } from '../services/financialCalc';

const STORAGE_KEY = 'tax';

/**
 * Maps account types to their tax treatment category.
 *
 * - ordinary: 401(k), Traditional IRA, Pension, Savings — taxed at regular brackets
 * - ltcg:     Brokerage — long-term capital gains / qualified dividends (preferential rates)
 * - taxFree:  Roth IRA — withdrawals are tax-free in retirement
 */
const ACCOUNT_TAX_TREATMENT: Record<AccountType, keyof IncomeAllocation> = {
  '401k': 'ordinary',
  traditional_ira: 'ordinary',
  pension: 'ordinary',
  savings: 'ordinary',
  brokerage: 'ltcg',
  roth_ira: 'taxFree',
};

interface TaxSettings {
  filingStatus: FilingStatus;
  stateRate: number;
  /** If true, percentages are auto-derived from account mix */
  autoAllocate: boolean;
  /** Manual override percentages (0-100 each) */
  manualOrdinaryPct: number;
  manualLtcgPct: number;
  manualTaxFreePct: number;
}

const DEFAULT_TAX: TaxSettings = {
  filingStatus: 'single',
  stateRate: 0.05,
  autoAllocate: true,
  manualOrdinaryPct: 70,
  manualLtcgPct: 15,
  manualTaxFreePct: 15,
};

export class TaxStore {
  filingStatus: FilingStatus;
  stateRate: number;
  autoAllocate: boolean;
  manualOrdinaryPct: number;
  manualLtcgPct: number;
  manualTaxFreePct: number;

  private goalStore: GoalStore;
  private accountStore: AccountStore;

  constructor(goalStore: GoalStore, accountStore: AccountStore) {
    this.goalStore = goalStore;
    this.accountStore = accountStore;

    const saved = load<TaxSettings>(STORAGE_KEY, DEFAULT_TAX);
    this.filingStatus = saved.filingStatus;
    this.stateRate = saved.stateRate;
    this.autoAllocate = saved.autoAllocate ?? DEFAULT_TAX.autoAllocate;
    this.manualOrdinaryPct = saved.manualOrdinaryPct ?? DEFAULT_TAX.manualOrdinaryPct;
    this.manualLtcgPct = saved.manualLtcgPct ?? DEFAULT_TAX.manualLtcgPct;
    this.manualTaxFreePct = saved.manualTaxFreePct ?? DEFAULT_TAX.manualTaxFreePct;

    makeAutoObservable(this);

    reaction(
      () => JSON.stringify(this.settingsSnapshot),
      () => save(STORAGE_KEY, this.settingsSnapshot),
    );
  }

  private get settingsSnapshot(): TaxSettings {
    return {
      filingStatus: this.filingStatus,
      stateRate: this.stateRate,
      autoAllocate: this.autoAllocate,
      manualOrdinaryPct: this.manualOrdinaryPct,
      manualLtcgPct: this.manualLtcgPct,
      manualTaxFreePct: this.manualTaxFreePct,
    };
  }

  /**
   * Auto-derive income allocation from projected account balances at retirement.
   * Each account's projected value is categorized by its tax treatment.
   *
   * For brokerage (LTCG) accounts, only the gains portion is taxable as LTCG.
   * The cost basis (starting balance + contributions) is a tax-free return of capital.
   */
  get autoAllocation(): IncomeAllocation {
    const years = this.goalStore.yearsToRetirement;
    const contributions = this.goalStore.monthlyContributions;
    const nominalReturn = getNominalReturn(this.goalStore.inflationRate);
    let ordinary = 0;
    let ltcg = 0;
    let taxFree = 0;

    for (const account of this.accountStore.accounts) {
      const vestedBalance = account.balance * (account.vestingPercent / 100);
      const monthlyContrib = contributions[account.id] ?? 0;
      const projected = calcFutureValue(
        vestedBalance,
        nominalReturn,
        years,
        monthlyContrib,
      );
      const treatment = ACCOUNT_TAX_TREATMENT[account.type];

      if (treatment === 'ltcg' && projected > 0) {
        // Brokerage: only gains are LTCG-taxable; cost basis is tax-free
        const costBasis = vestedBalance + monthlyContrib * 12 * years;
        const gains = Math.max(0, projected - costBasis);
        ltcg += gains;
        taxFree += projected - gains;
      } else if (treatment === 'ordinary') {
        ordinary += projected;
      } else {
        taxFree += projected;
      }
    }

    const total = ordinary + ltcg + taxFree;
    if (total <= 0) return { ordinary: 100, ltcg: 0, taxFree: 0 };

    return {
      ordinary: (ordinary / total) * 100,
      ltcg: (ltcg / total) * 100,
      taxFree: (taxFree / total) * 100,
    };
  }

  /** The active allocation — either auto-derived or manual */
  get allocation(): IncomeAllocation {
    if (this.autoAllocate) {
      return this.autoAllocation;
    }
    return {
      ordinary: this.manualOrdinaryPct,
      ltcg: this.manualLtcgPct,
      taxFree: this.manualTaxFreePct,
    };
  }

  /** Get full tax breakdown for the gross annual retirement income */
  get breakdown(): TaxBreakdown {
    const grossAnnual = this.goalStore.estimatedMonthlyIncome * 12;
    return calcRetirementTax(grossAnnual, this.filingStatus, this.stateRate, this.allocation);
  }

  get netMonthlyIncome(): number {
    return this.breakdown.netMonthly;
  }

  get effectiveRate(): number {
    return this.breakdown.effectiveRate;
  }

  setFilingStatus(status: FilingStatus): void {
    this.filingStatus = status;
  }

  setStateRate(rate: number): void {
    this.stateRate = Math.max(0, Math.min(0.13, rate));
  }

  setAutoAllocate(auto: boolean): void {
    this.autoAllocate = auto;
  }

  setManualOrdinaryPct(pct: number): void {
    this.manualOrdinaryPct = Math.max(0, Math.min(100, pct));
  }

  setManualLtcgPct(pct: number): void {
    this.manualLtcgPct = Math.max(0, Math.min(100, pct));
  }

  setManualTaxFreePct(pct: number): void {
    this.manualTaxFreePct = Math.max(0, Math.min(100, pct));
  }

  /** Restore full tax settings state (used by setup restore) */
  restoreState(settings: {
    filingStatus: FilingStatus;
    stateRate: number;
    autoAllocate: boolean;
    manualOrdinaryPct: number;
    manualLtcgPct: number;
    manualTaxFreePct: number;
  }): void {
    this.filingStatus = settings.filingStatus;
    this.stateRate = settings.stateRate;
    this.autoAllocate = settings.autoAllocate;
    this.manualOrdinaryPct = settings.manualOrdinaryPct;
    this.manualLtcgPct = settings.manualLtcgPct;
    this.manualTaxFreePct = settings.manualTaxFreePct;
  }
}
