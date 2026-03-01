import { observer } from 'mobx-react-lite';
import { DollarSign } from 'lucide-react';
import type { OnboardingStore } from '../../../stores/OnboardingStore';

interface IncomeStepProps {
  store: OnboardingStore;
}

export const IncomeStep = observer(function IncomeStep({ store }: IncomeStepProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">Income</h2>
          <p className="text-zinc-500 text-xs">Your earnings and retirement income needs.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Annual Income */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
            Current Annual Income (pre-tax)
          </label>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden focus-within:border-cyan-500/50 transition-colors">
            <span className="pl-3 text-xs text-zinc-500">$</span>
            <input
              type="number"
              min={0}
              value={store.annualIncome || ''}
              onChange={(e) => store.setAnnualIncome(Number(e.target.value))}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white tabular-nums placeholder-zinc-600 focus:outline-none"
              placeholder="85,000"
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            Used to estimate your future Social Security benefits.
          </p>
        </div>

        {/* Desired Monthly Income */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
            Desired Monthly Income in Retirement
          </label>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden focus-within:border-cyan-500/50 transition-colors">
            <span className="pl-3 text-xs text-zinc-500">$</span>
            <input
              type="number"
              min={0}
              value={store.desiredMonthlyIncome || ''}
              onChange={(e) => store.setDesiredMonthlyIncome(Number(e.target.value))}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white tabular-nums placeholder-zinc-600 focus:outline-none"
              placeholder="4,000"
            />
            <span className="pr-3 text-xs text-zinc-500">/mo</span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            How much you'd like to spend each month in retirement (today's dollars).
          </p>
        </div>

        {/* Quick context */}
        {store.annualIncome > 0 && store.desiredMonthlyIncome > 0 && (
          <div className="bg-zinc-800/40 border border-zinc-800/60 rounded-lg px-4 py-3 mt-2">
            <p className="text-xs text-zinc-400">
              <span className="text-zinc-500">Replacement ratio: </span>
              <span className="text-white font-medium tabular-nums">
                {Math.round((store.desiredMonthlyIncome * 12) / store.annualIncome * 100)}%
              </span>
              <span className="text-zinc-600 ml-1">of current income</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
