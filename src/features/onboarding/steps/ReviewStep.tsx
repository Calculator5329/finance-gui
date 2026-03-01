import { observer } from 'mobx-react-lite';
import { CheckCircle } from 'lucide-react';
import type { OnboardingStore } from '../../../stores/OnboardingStore';
import { ACCOUNT_TYPE_LABELS } from '../../../core/types/account';

interface ReviewStepProps {
  store: OnboardingStore;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const ReviewStep = observer(function ReviewStep({ store }: ReviewStepProps) {
  const totalBalance = store.accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalContributionPct = store.accounts.reduce((sum, a) => sum + (a.contributionPercent ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">
            Review Your Plan
          </h2>
          <p className="text-zinc-500 text-xs">
            Confirm your details and launch.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* About You */}
        <div className="bg-zinc-800/40 border border-zinc-800/60 rounded-lg px-4 py-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            About You
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-zinc-600">Age</p>
              <p className="text-sm text-white font-medium tabular-nums">{store.currentAge}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600">Retire at</p>
              <p className="text-sm text-white font-medium tabular-nums">{store.retirementAge}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600">Status</p>
              <p className="text-sm text-white font-medium capitalize">
                {store.filingStatus === 'married_joint' ? 'Married' : 'Single'}
              </p>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="bg-zinc-800/40 border border-zinc-800/60 rounded-lg px-4 py-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            Income
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-zinc-600">Annual Income</p>
              <p className="text-sm text-white font-medium tabular-nums">
                {formatCurrency(store.annualIncome)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600">Monthly Goal</p>
              <p className="text-sm text-white font-medium tabular-nums">
                {formatCurrency(store.desiredMonthlyIncome)}/mo
              </p>
            </div>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-zinc-800/40 border border-zinc-800/60 rounded-lg px-4 py-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            Accounts ({store.accounts.length})
          </h3>
          {store.accounts.length === 0 ? (
            <p className="text-xs text-zinc-600">No accounts added — you can add them later.</p>
          ) : (
            <div className="space-y-1.5">
              {store.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{account.name || 'Unnamed'}</span>
                    <span className="text-zinc-600">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </span>
                  </div>
                  <span className="text-zinc-300 tabular-nums">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-700/50">
                <span className="text-zinc-500">Total</span>
                <span className="text-cyan-400 font-medium tabular-nums">
                  {formatCurrency(totalBalance)}
                </span>
              </div>
              {totalContributionPct > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Total allocation</span>
                  <span className="text-zinc-300 tabular-nums">
                    {totalContributionPct}% of disposable
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
