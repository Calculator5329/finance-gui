import { makeAutoObservable, reaction } from 'mobx';
import type { RetirementGoal, GoalStatus } from '../core/types/goal';
import { calcFutureValue, calcMonthlyRetirementIncome, adjustForInflation, calcNetWorth, calcRequiredSavingsForSpending, resolveAccountContributions } from '../services/financialCalc';
import { calcYearByYearProjection, type YearProjection } from '../services/projectionCalc';
import type { FilingStatus } from '../core/types/tax';
import { calcW2Tax, calcRetirementTax, type W2TaxBreakdown, type IncomeAllocation } from '../services/taxCalc';
import { FULL_RETIREMENT_AGE, MIN_CLAIM_AGE, MAX_CLAIM_AGE, estimateSSBenefit } from '../services/socialSecurityCalc';
import { save, load } from '../services/persistence';
import type { AccountStore } from './AccountStore';

const STORAGE_KEY = 'goals';
const SETTINGS_KEY = 'goal-settings';

const DEFAULT_GOAL: RetirementGoal = {
  id: 'goal-retirement-default',
  targetAge: 45,
  currentAge: 20,
  monthlySpending: 8000,
  savingsRate: 0.15,
};

interface GoalSettings {
  inflationRate: number;
  currentAnnualIncome: number;
  ssClaimAge: number;
  /** Pre-retirement monthly expenses (separate from retirement spending goal) */
  monthlyExpenses: number;
}

const DEFAULT_SETTINGS: GoalSettings = {
  inflationRate: 0.03,
  currentAnnualIncome: 85000,
  ssClaimAge: FULL_RETIREMENT_AGE,
  monthlyExpenses: 2000,
};

/**
 * Getter for tax settings — resolved lazily to break circular dependency
 * between GoalStore and TaxStore.
 */
export interface TaxSettingsGetter {
  readonly filingStatus: FilingStatus;
  readonly stateRate: number;
  readonly allocation: IncomeAllocation;
}

export class GoalStore {
  goal: RetirementGoal;
  inflationRate: number;
  currentAnnualIncome: number;
  ssClaimAge: number;
  /** Pre-retirement monthly expenses — drives disposable income calculation */
  monthlyExpenses: number;
  private accountStore: AccountStore;

  /** Late-bound reference to tax settings (set by RootStore after construction) */
  private _taxSettings: TaxSettingsGetter | null = null;

  constructor(accountStore: AccountStore) {
    this.accountStore = accountStore;
    this.goal = load<RetirementGoal>(STORAGE_KEY, DEFAULT_GOAL);

    const settings = load<GoalSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    this.inflationRate = settings.inflationRate;
    this.currentAnnualIncome = settings.currentAnnualIncome;
    // Migration: default to full retirement age if not present in persisted settings
    this.ssClaimAge = settings.ssClaimAge ?? FULL_RETIREMENT_AGE;
    this.monthlyExpenses = settings.monthlyExpenses ?? DEFAULT_SETTINGS.monthlyExpenses;

    makeAutoObservable<GoalStore, '_taxSettings' | 'projectForTargetAge'>(this, {
      _taxSettings: false,
      projectForTargetAge: false,
    });

    reaction(
      () => JSON.stringify(this.goal),
      () => save(STORAGE_KEY, this.goal),
    );

    reaction(
      () => JSON.stringify({ inflationRate: this.inflationRate, currentAnnualIncome: this.currentAnnualIncome, ssClaimAge: this.ssClaimAge, monthlyExpenses: this.monthlyExpenses }),
      () => save(SETTINGS_KEY, { inflationRate: this.inflationRate, currentAnnualIncome: this.currentAnnualIncome, ssClaimAge: this.ssClaimAge, monthlyExpenses: this.monthlyExpenses }),
    );
  }

  /** Called by RootStore to wire the TaxStore reference after construction */
  setTaxSettings(getter: TaxSettingsGetter): void {
    this._taxSettings = getter;
  }

  private get filingStatus(): FilingStatus {
    if (this._taxSettings === null) {
      console.warn('[GoalStore] _taxSettings accessed before setTaxSettings() was called — using fallback values.');
    }
    return this._taxSettings?.filingStatus ?? 'single';
  }

  private get stateRate(): number {
    return this._taxSettings?.stateRate ?? 0.05;
  }

  private get allocation(): IncomeAllocation {
    return this._taxSettings?.allocation ?? { ordinary: 100, ltcg: 0, taxFree: 0 };
  }

  // ── Required Savings (auto-computed target) ─────────────────

  /**
   * The savings needed at retirement so that 4% rule withdrawals plus
   * Social Security, after retirement taxes, cover monthly spending.
   * Accounts for gap-year reserve if retiring before SS claim age.
   */
  get requiredSavings(): number {
    return calcRequiredSavingsForSpending(
      this.goal.monthlySpending,
      this.filingStatus,
      this.stateRate,
      this.allocation,
      0.04,
      this.ssMonthlyBenefit * 12,
      this.ssGapYears,
    );
  }

  // ── W2 (Working Years) Tax & Income ───────────────────────

  /** Full W2 tax breakdown for current working income */
  get w2TaxBreakdown(): W2TaxBreakdown {
    return calcW2Tax(this.currentAnnualIncome, this.filingStatus, this.stateRate);
  }

  /** Annual take-home pay after W2 taxes */
  get takeHomePayAnnual(): number {
    return this.w2TaxBreakdown.netAnnual;
  }

  /** Monthly take-home pay after W2 taxes */
  get takeHomePayMonthly(): number {
    return this.w2TaxBreakdown.netMonthly;
  }

  /** Monthly savings = take-home minus pre-retirement expenses, clamped to >= 0 */
  get monthlySavings(): number {
    return Math.max(0, this.takeHomePayMonthly - this.monthlyExpenses);
  }

  setMonthlyExpenses(value: number): void {
    this.monthlyExpenses = Math.max(0, value);
  }

  /** Auto-computed savings rate = annual savings / gross annual income */
  get computedSavingsRate(): number {
    if (this.currentAnnualIncome <= 0) return 0;
    return (this.monthlySavings * 12) / this.currentAnnualIncome;
  }

  // ── Projections ───────────────────────────────────────────

  /** Per-account monthly contribution map, resolved from disposable income + contribution percents */
  get monthlyContributions(): Record<string, number> {
    return resolveAccountContributions(this.accountStore.accounts, this.monthlySavings);
  }

  /**
   * Raw projected portfolio value at retirement — independent of `progress`
   * to avoid MobX cycles. Uses contributionPercent × monthlySavings for contributions.
   */
  get projectedAmountAtRetirement(): number {
    const years = this.yearsToRetirement;
    if (years <= 0) return this.accountStore.netWorth;
    const contributions = this.monthlyContributions;
    return this.accountStore.accounts.reduce((total, account) => {
      const vestedBalance = account.balance * (account.vestingPercent / 100);
      return total + calcFutureValue(vestedBalance, account.annualReturn, years, contributions[account.id] ?? 0);
    }, 0);
  }

  /** Gross monthly retirement income (portfolio 4% withdrawal + SS) */
  get estimatedMonthlyIncome(): number {
    const portfolioIncome = calcMonthlyRetirementIncome(this.portfolioAfterGapReserve);
    return portfolioIncome + this.ssMonthlyBenefit;
  }

  get realProjectedAmount(): number {
    return adjustForInflation(
      this.projectedAmountAtRetirement,
      this.inflationRate,
      this.yearsToRetirement,
    );
  }

  /**
   * Inflation-adjusted gross monthly retirement income.
   * Portfolio portion is discounted for inflation; SS benefits include COLA
   * so they are treated as already inflation-adjusted and added directly.
   */
  get realMonthlyIncome(): number {
    const realPortfolio = adjustForInflation(
      this.portfolioAfterGapReserve,
      this.inflationRate,
      this.yearsToRetirement,
    );
    const portfolioIncome = calcMonthlyRetirementIncome(realPortfolio);
    return portfolioIncome + this.ssMonthlyBenefit;
  }

  /**
   * Inflation-adjusted net monthly retirement income.
   * Takes the real (inflation-adjusted) gross income, applies retirement taxes,
   * and returns the net amount in today's dollars.
   */
  get realNetRetirementIncome(): number {
    const realGrossAnnual = this.realMonthlyIncome * 12;
    if (realGrossAnnual <= 0) return 0;
    const taxBreakdown = calcRetirementTax(
      realGrossAnnual,
      this.filingStatus,
      this.stateRate,
      this.allocation,
    );
    return taxBreakdown.netMonthly;
  }

  get progress(): { percent: number; status: GoalStatus; projectedAmount: number } {
    const projectedAmount = this.projectedAmountAtRetirement;
    const spending = this.goal.monthlySpending;

    if (spending <= 0) {
      return { percent: 100, status: 'ahead', projectedAmount };
    }

    // Income-based comparison: does inflation-adjusted net retirement
    // income cover the desired monthly spending?
    const income = this.realNetRetirementIncome;
    const ratio = income / spending;
    const percent = Math.min(ratio * 100, 150);

    let status: GoalStatus;
    if (ratio >= 1.1) status = 'ahead';
    else if (ratio >= 1) status = 'on_track';
    else status = 'behind';

    return { percent, status, projectedAmount };
  }

  get yearsToRetirement(): number {
    return Math.max(0, this.goal.targetAge - this.goal.currentAge);
  }

  /** True when SS benefits start after the planned retirement age */
  get ssStartsAfterRetirement(): boolean {
    return this.ssClaimAge > this.goal.targetAge;
  }

  /** Number of years between retirement and SS benefits kicking in (0 if SS starts at or before retirement) */
  get ssGapYears(): number {
    return Math.max(0, this.ssClaimAge - this.goal.targetAge);
  }

  /** Estimated monthly Social Security benefit based on current income and claim age */
  get ssMonthlyBenefit(): number {
    if (this.currentAnnualIncome <= 0) return 0;
    return estimateSSBenefit(this.currentAnnualIncome, this.ssClaimAge);
  }

  get ssMinClaimAge(): number { return MIN_CLAIM_AGE; }
  get ssMaxClaimAge(): number { return MAX_CLAIM_AGE; }

  // ── Gap-Year Reserve (retirement before SS starts) ──────────

  /**
   * Annual spending shortfall during gap years: how much more than 4%
   * of the portfolio must be withdrawn each year to cover expenses.
   */
  get gapAnnualShortfall(): number {
    if (this.ssGapYears <= 0) return 0;
    return Math.max(0, this.goal.monthlySpending * 12 - this.projectedAmountAtRetirement * 0.04);
  }

  /** Lump sum withdrawn at retirement to cover gap-year shortfalls */
  get gapReserve(): number {
    return this.gapAnnualShortfall * this.ssGapYears;
  }

  /** Portfolio value after reserving for gap-year withdrawals */
  get portfolioAfterGapReserve(): number {
    return Math.max(0, this.projectedAmountAtRetirement - this.gapReserve);
  }

  get yearByYearProjection(): YearProjection[] {
    return calcYearByYearProjection(
      this.accountStore.accounts,
      this.goal,
      this.inflationRate,
      this.monthlySavings,
      this.requiredSavings,
    );
  }

  // ── Ending Net Worth & Contribution/Growth Split ──────────

  /** Projected net worth at retirement (nominal) */
  get endingNetWorth(): number {
    const proj = this.yearByYearProjection;
    return proj.length > 0 ? proj[proj.length - 1].totalNominal : this.accountStore.netWorth;
  }

  /** Projected net worth at retirement (inflation-adjusted) */
  get endingNetWorthReal(): number {
    const proj = this.yearByYearProjection;
    return proj.length > 0 ? proj[proj.length - 1].totalReal : this.accountStore.netWorth;
  }

  /** Current net worth (sum of vested balances) */
  get currentNetWorth(): number {
    return calcNetWorth(this.accountStore.accounts);
  }

  /** Total new contributions from now to retirement (based on percent allocations) */
  get totalContributionsAtRetirement(): number {
    const contributions = resolveAccountContributions(this.accountStore.accounts, this.monthlySavings);
    const effectiveMonthly = Object.values(contributions).reduce((sum, v) => sum + v, 0);
    return effectiveMonthly * 12 * this.yearsToRetirement;
  }

  /** Total investment growth at retirement = ending - current - contributions */
  get totalGrowthAtRetirement(): number {
    return Math.max(0, this.endingNetWorth - this.currentNetWorth - this.totalContributionsAtRetirement);
  }

  /** % of ending net worth from contributions (current balances + new money) */
  get contributionSharePercent(): number {
    if (this.endingNetWorth <= 0) return 0;
    return ((this.currentNetWorth + this.totalContributionsAtRetirement) / this.endingNetWorth) * 100;
  }

  /** % of ending net worth from investment growth */
  get growthPercent(): number {
    if (this.endingNetWorth <= 0) return 0;
    return (this.totalGrowthAtRetirement / this.endingNetWorth) * 100;
  }

  // ── Tax Basis Tracking ────────────────────────────────────

  /**
   * Cost basis = future contributions only (deductible on sale).
   * These represent new money invested that hasn't grown yet.
   */
  get costBasis(): number {
    return this.totalContributionsAtRetirement;
  }

  /**
   * Taxable gains at retirement (conservative estimate):
   * - Current balances: 100% assumed taxable (no cost basis)
   * - Growth on everything: fully taxable
   * - Only future contribution amounts are cost basis
   */
  get taxableGains(): number {
    return Math.max(0, this.endingNetWorth - this.costBasis);
  }

  /** Percentage of ending net worth that would be taxable gains */
  get taxablePercent(): number {
    if (this.endingNetWorth <= 0) return 0;
    return (this.taxableGains / this.endingNetWorth) * 100;
  }

  // ── Actionable Insights ─────────────────────────────────

  /** Monthly income gap: positive = surplus, negative = shortfall */
  get monthlyIncomeGap(): number {
    return this.realNetRetirementIncome - this.goal.monthlySpending;
  }

  /**
   * Additional monthly savings needed to close the portfolio gap.
   * Uses contribution-weighted blended return and FV annuity inverse.
   */
  get additionalMonthlySavingsNeeded(): number {
    const portfolioGap = this.requiredSavings - this.projectedAmountAtRetirement;
    if (portfolioGap <= 0) return 0;
    const years = this.yearsToRetirement;
    if (years <= 0) return 0;

    const accounts = this.accountStore.accounts;
    const totalPct = accounts.reduce((sum, a) => sum + (a.contributionPercent ?? 0), 0);
    const blendedReturn = totalPct > 0
      ? accounts.reduce((sum, a) => sum + a.annualReturn * ((a.contributionPercent ?? 0) / totalPct), 0)
      : 0.07;

    const monthlyRate = blendedReturn / 12;
    const months = years * 12;

    if (monthlyRate <= 0) return portfolioGap / months;
    return portfolioGap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }

  /**
   * Years to delay retirement to meet the savings target.
   * 0 if already on track; -1 if gap can't close within 40 years.
   */
  get yearsToDelayForTarget(): number {
    if (this.projectedAmountAtRetirement >= this.requiredSavings) return 0;
    for (let extra = 1; extra <= 40; extra++) {
      const { projected, required } = this.projectForTargetAge(this.goal.targetAge + extra);
      if (projected >= required) return extra;
    }
    return -1;
  }

  /**
   * Years the user could retire early and still meet their goal.
   * 0 if behind or no room.
   */
  get yearsCanRetireEarly(): number {
    if (this.progress.status === 'behind') return 0;
    if (this.yearsToRetirement <= 1) return 0;
    let result = 0;
    for (let fewer = 1; fewer < this.yearsToRetirement; fewer++) {
      const targetAge = this.goal.targetAge - fewer;
      if (targetAge <= this.goal.currentAge) break;
      const { projected, required } = this.projectForTargetAge(targetAge);
      if (projected < required) break;
      result = fewer;
    }
    return result;
  }

  /** Marginal value of saving $100 more per month until retirement */
  get savingsImpactPer100(): number {
    if (this.yearsToRetirement <= 0) return 0;
    const accounts = this.accountStore.accounts;
    const totalPct = accounts.reduce((sum, a) => sum + (a.contributionPercent ?? 0), 0);
    const blendedReturn = totalPct > 0
      ? accounts.reduce((sum, a) => sum + a.annualReturn * ((a.contributionPercent ?? 0) / totalPct), 0)
      : 0.07;
    const monthlyRate = blendedReturn / 12;
    const months = this.yearsToRetirement * 12;
    if (monthlyRate <= 0) return 100 * months;
    return 100 * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  /** Project portfolio and required savings for a hypothetical target age */
  private projectForTargetAge(targetAge: number): { projected: number; required: number } {
    const totalYears = Math.max(0, targetAge - this.goal.currentAge);
    const accounts = this.accountStore.accounts;
    const contributions = resolveAccountContributions(accounts, this.monthlySavings);

    const projected = accounts.reduce((total, account) => {
      const vestedBalance = account.balance * (account.vestingPercent / 100);
      return total + calcFutureValue(vestedBalance, account.annualReturn, totalYears, contributions[account.id] ?? 0);
    }, 0);

    const gapYears = Math.max(0, this.ssClaimAge - targetAge);
    const required = calcRequiredSavingsForSpending(
      this.goal.monthlySpending,
      this.filingStatus,
      this.stateRate,
      this.allocation,
      0.04,
      this.ssMonthlyBenefit * 12,
      gapYears,
    );

    return { projected, required };
  }

  // ── Actions ───────────────────────────────────────────────

  updateGoal(updates: Partial<Omit<RetirementGoal, 'id'>>): void {
    this.goal = { ...this.goal, ...updates };
  }

  setInflationRate(rate: number): void {
    this.inflationRate = Math.max(0, Math.min(0.10, rate));
  }

  setCurrentAnnualIncome(income: number): void {
    this.currentAnnualIncome = Math.max(0, income);
  }

  setSSClaimAge(age: number): void {
    this.ssClaimAge = Math.max(MIN_CLAIM_AGE, Math.min(MAX_CLAIM_AGE, Math.round(age)));
  }

  /** Restore full goal + settings state (used by setup restore) */
  restoreState(
    goal: RetirementGoal,
    settings: { inflationRate: number; currentAnnualIncome: number; ssClaimAge: number; monthlyExpenses?: number },
  ): void {
    this.goal = { ...goal };
    this.inflationRate = settings.inflationRate;
    this.currentAnnualIncome = settings.currentAnnualIncome;
    this.ssClaimAge = settings.ssClaimAge ?? FULL_RETIREMENT_AGE;
    this.monthlyExpenses = settings.monthlyExpenses ?? DEFAULT_SETTINGS.monthlyExpenses;
  }
}
