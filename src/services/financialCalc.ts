import type { Account } from '../core/types/account';
import type { RetirementGoal, GoalStatus } from '../core/types/goal';
import type { FilingStatus } from '../core/types/tax';
import { calcRetirementTax, type IncomeAllocation } from './taxCalc';

/**
 * Calculate future value with compound interest and regular monthly contributions.
 * Uses monthly compounding.
 */
export function calcFutureValue(
  principal: number,
  annualRate: number,
  years: number,
  monthlyContribution: number = 0,
): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;

  // FV of lump sum
  const fvPrincipal = principal * Math.pow(1 + monthlyRate, months);

  // FV of annuity (monthly contributions)
  const fvContributions =
    monthlyRate > 0
      ? monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthlyContribution * months;

  return fvPrincipal + fvContributions;
}

/**
 * Calculate current net worth from an array of accounts.
 * Adjusts each balance by its vesting percentage.
 */
export function calcNetWorth(accounts: Account[]): number {
  return accounts.reduce((total, account) => {
    const vestedBalance = account.balance * (account.vestingPercent / 100);
    return total + vestedBalance;
  }, 0);
}

/**
 * Calculate goal progress and determine status.
 *
 * @param targetAmount - The required savings target (auto-computed from spending needs).
 */
export function calcGoalProgress(
  currentNetWorth: number,
  goal: RetirementGoal,
  accounts: Account[],
  targetAmount: number,
  inflationRate: number = 0.03,
): { percent: number; status: GoalStatus; projectedAmount: number } {
  const yearsToRetirement = goal.targetAge - goal.currentAge;

  if (targetAmount <= 0) {
    return { percent: 100, status: 'ahead', projectedAmount: currentNetWorth };
  }

  if (yearsToRetirement <= 0) {
    return {
      percent: currentNetWorth >= targetAmount ? 100 : (currentNetWorth / targetAmount) * 100,
      status: currentNetWorth >= targetAmount ? 'ahead' : 'behind',
      projectedAmount: currentNetWorth,
    };
  }

  const nominalReturn = getNominalReturn(inflationRate);
  const projectedAmount = accounts.reduce((total, account) => {
    const vestedBalance = account.balance * (account.vestingPercent / 100);
    return total + calcFutureValue(vestedBalance, nominalReturn, yearsToRetirement, account.monthlyContribution);
  }, 0);

  const percent = Math.min((projectedAmount / targetAmount) * 100, 150);

  let status: GoalStatus;
  if (percent >= 110) status = 'ahead';
  else if (percent >= 90) status = 'on_track';
  else status = 'behind';

  return { percent, status, projectedAmount };
}

/**
 * Calculate estimated monthly retirement income using the 4% rule (or custom rate).
 */
export function calcMonthlyRetirementIncome(
  totalSavings: number,
  annualWithdrawalRate: number = 0.04,
): number {
  return (totalSavings * annualWithdrawalRate) / 12;
}

/**
 * Calculate how much total savings are required for a target monthly income.
 */
export function calcRequiredSavings(
  targetMonthlyIncome: number,
  annualWithdrawalRate: number = 0.04,
): number {
  return (targetMonthlyIncome * 12) / annualWithdrawalRate;
}

/**
 * Calculate the savings needed so that 4% rule withdrawals plus Social Security,
 * after retirement taxes, produce enough net income to cover monthly spending.
 *
 * When there are gap years between retirement and SS claim age, a lump-sum
 * reserve is carved out for the annual shortfall (spending minus 4% withdrawal)
 * during those years. The 4% rule is then applied to the remaining portfolio.
 *
 * Uses binary search because taxes are progressive — no closed-form inverse.
 *
 * @param ssAnnualBenefit - Annual Social Security benefit (already COLA-adjusted). Default 0.
 * @param gapYears - Years between retirement and SS claim age. Default 0.
 * @returns The total savings required at retirement (including gap reserve).
 */
export function calcRequiredSavingsForSpending(
  monthlySpending: number,
  filingStatus: FilingStatus,
  stateRate: number,
  allocation: IncomeAllocation,
  withdrawalRate: number = 0.04,
  ssAnnualBenefit: number = 0,
  gapYears: number = 0,
): number {
  if (monthlySpending <= 0) return 0;

  const targetNetAnnual = monthlySpending * 12;

  // Upper bound: assume ~60% effective tax rate at worst → need ~2.5x gross
  let lo = 0;
  let hi = (targetNetAnnual * 3) / withdrawalRate;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;

    // Gap reserve: extra withdrawals above 4% needed during gap years
    const gapAnnualShortfall = gapYears > 0
      ? Math.max(0, targetNetAnnual - mid * withdrawalRate)
      : 0;
    const gapReserve = gapAnnualShortfall * gapYears;
    const portfolioAfterGap = Math.max(0, mid - gapReserve);

    // SS-era gross income: 4% of remaining portfolio + SS benefits
    const grossAnnual = portfolioAfterGap * withdrawalRate + ssAnnualBenefit;
    const breakdown = calcRetirementTax(grossAnnual, filingStatus, stateRate, allocation);

    if (breakdown.netAnnual < targetNetAnnual) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return Math.ceil(hi);
}

/**
 * Adjust a future nominal value to today's dollars.
 */
export function adjustForInflation(
  futureValue: number,
  inflationRate: number,
  years: number,
): number {
  if (inflationRate <= 0 || years <= 0) return futureValue;
  return futureValue / Math.pow(1 + inflationRate, years);
}

/** Nominal return = 7% real + inflation (Fisher approximation) */
export const NOMINAL_RETURN_REAL_BASE = 0.07;

export function getNominalReturn(inflationRate: number): number {
  return NOMINAL_RETURN_REAL_BASE + inflationRate;
}

/**
 * Calculate the real (inflation-adjusted) rate of return.
 */
export function calcRealReturn(
  nominalRate: number,
  inflationRate: number,
): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

/**
 * Resolve the effective monthly contribution for each account.
 *
 * Distribution priority:
 * 1. If `monthlySavings` is provided and total contribution % > 0, distribute
 *    proportionally by each account's `contributionPercent`.
 * 2. Otherwise fall back to each account's `monthlyContribution` field.
 *
 * Overflow: if an account's current balance has already hit its `maxBalance` cap
 * (and an overflow target is configured), that account's contribution is
 * redirected to the overflow account instead.
 *
 * Returns a `Record<accountId, monthlyAmount>` for every account in the list.
 */
export function resolveAccountContributions(
  accounts: Account[],
  monthlySavings: number,
): Record<string, number> {
  const totalPercent = accounts.reduce((sum, a) => sum + (a.contributionPercent ?? 0), 0);

  const result: Record<string, number> = {};
  for (const account of accounts) {
    result[account.id] = (monthlySavings > 0 && totalPercent > 0)
      ? monthlySavings * ((account.contributionPercent ?? 0) / 100)
      : account.monthlyContribution;
  }

  // Redirect contributions from capped accounts to their overflow target
  for (const account of accounts) {
    const cap = account.maxBalance ?? 0;
    if (cap > 0 && account.balance >= cap && account.overflowAccountId) {
      const overflow = result[account.id] ?? 0;
      result[account.overflowAccountId] = (result[account.overflowAccountId] ?? 0) + overflow;
      result[account.id] = 0;
    }
  }

  return result;
}

/**
 * Format a number as USD currency string.
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
