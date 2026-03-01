export type AccountType = '401k' | 'roth_ira' | 'traditional_ira' | 'pension' | 'brokerage' | 'savings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  provider: string;
  balance: number;
  monthlyContribution: number;
  /** Percentage of disposable income allocated to this account (0-100) */
  contributionPercent: number;
  annualReturn: number; // as decimal, e.g. 0.07 for 7%
  vestingPercent: number; // 0-100
  /** Max balance cap. When reached, contributions overflow to overflowAccountId. 0 = unlimited. */
  maxBalance: number;
  /** Account ID to redirect overflow contributions to when maxBalance is hit */
  overflowAccountId: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  '401k': '401(k)',
  roth_ira: 'Roth IRA',
  traditional_ira: 'Traditional IRA',
  pension: 'Pension Plan',
  brokerage: 'Brokerage',
  savings: 'Savings',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  '401k': '#ef4444',       // red-500
  roth_ira: '#22c55e',     // green-500
  traditional_ira: '#3b82f6', // blue-500
  pension: '#f59e0b',      // amber-500
  brokerage: '#8b5cf6',    // violet-500
  savings: '#06b6d4',      // cyan-500
};
