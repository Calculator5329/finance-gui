import type { Account } from '../core/types/account';
import type { RetirementGoal } from '../core/types/goal';
import { calcFutureValue, getNominalReturn, resolveAccountContributions } from './financialCalc';

export interface YearProjection {
  year: number;
  age: number;
  accounts: Record<string, number>;
  totalNominal: number;
  totalReal: number;
  /** Cumulative new contributions (does NOT include starting balances) */
  cumulativeContributions: number;
  /** Total investment growth = totalNominal - startingBalances - cumulativeContributions */
  totalGrowth: number;
  /** Cost basis: future contributions only (deductible). Current balances are 100% taxable. */
  costBasis: number;
  /** Taxable gains: current balances (100%) + all growth */
  taxableGains: number;
  goalLine: number;
}

/**
 * Generate year-by-year projection data for all accounts.
 * Returns one entry per year from current age to target retirement age.
 *
 * @param monthlySavings - Total monthly contribution derived from income - taxes - expenses.
 *                         Distributed proportionally across accounts by balance weight.
 *                         If 0, falls back to per-account monthlyContribution fields.
 * @param targetAmount   - The required savings target (auto-computed from spending needs).
 *                         Used for the goal line interpolation.
 */
export function calcYearByYearProjection(
  accounts: Account[],
  goal: RetirementGoal,
  inflationRate: number,
  monthlySavings: number = 0,
  targetAmount: number = 0,
): YearProjection[] {
  const years = Math.max(0, goal.targetAge - goal.currentAge);
  if (years === 0) return [];

  const projections: YearProjection[] = [];

  // Current total (starting net worth)
  const currentTotal = accounts.reduce(
    (sum, a) => sum + a.balance * (a.vestingPercent / 100),
    0,
  );

  const accountContributions = resolveAccountContributions(accounts, monthlySavings);

  for (let y = 0; y <= years; y++) {
    const age = goal.currentAge + y;
    const accountBalances: Record<string, number> = {};
    let totalNominal = 0;
    let cumulativeContributions = 0;

    const nominalReturn = getNominalReturn(inflationRate);
    for (const account of accounts) {
      const vestedBalance = account.balance * (account.vestingPercent / 100);
      const monthlyContrib = accountContributions[account.id] ?? 0;
      const projected = calcFutureValue(
        vestedBalance,
        nominalReturn,
        y,
        monthlyContrib,
      );
      accountBalances[account.id] = projected;
      totalNominal += projected;
      cumulativeContributions += monthlyContrib * 12 * y;
    }

    // Investment growth = ending value - starting balances - new money put in
    const totalGrowth = Math.max(0, totalNominal - currentTotal - cumulativeContributions);

    // Cost basis = only the future contributions (deductible portion)
    // Current balances are assumed 100% taxable gains (conservative)
    const costBasis = cumulativeContributions;

    // Taxable gains = everything except cost basis of new contributions
    const taxableGains = Math.max(0, totalNominal - costBasis);

    // Inflation-adjusted (real) value
    const totalReal =
      inflationRate > 0
        ? totalNominal / Math.pow(1 + inflationRate, y)
        : totalNominal;

    // Linear interpolation from current to goal
    const goalLine = currentTotal + ((targetAmount - currentTotal) * y) / years;

    projections.push({
      year: new Date().getFullYear() + y,
      age,
      accounts: accountBalances,
      totalNominal,
      totalReal,
      cumulativeContributions,
      totalGrowth,
      costBasis,
      taxableGains,
      goalLine,
    });
  }

  return projections;
}
