import { observer } from 'mobx-react-lite';
import { User } from 'lucide-react';
import type { OnboardingStore } from '../../../stores/OnboardingStore';
import type { FilingStatus } from '../../../core/types/tax';

interface AboutYouStepProps {
  store: OnboardingStore;
}

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married_joint', label: 'Married' },
];

export const AboutYouStep = observer(function AboutYouStep({ store }: AboutYouStepProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <User className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">About You</h2>
          <p className="text-zinc-500 text-xs">Tell us about your retirement timeline.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Current Age */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
            Current Age
          </label>
          <input
            type="number"
            min={18}
            max={100}
            value={store.currentAge || ''}
            onChange={(e) => store.setCurrentAge(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white tabular-nums placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
            placeholder="30"
          />
        </div>

        {/* Retirement Age */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
            Target Retirement Age
          </label>
          <input
            type="number"
            min={store.currentAge + 1}
            max={100}
            value={store.retirementAge || ''}
            onChange={(e) => store.setRetirementAge(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white tabular-nums placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
            placeholder="65"
          />
          {store.retirementAge > store.currentAge && store.currentAge > 0 && (
            <p className="text-[10px] text-zinc-600 mt-1">
              {store.retirementAge - store.currentAge} years to retirement
            </p>
          )}
        </div>

        {/* Filing Status */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            Are you single or married?
          </label>
          <div className="flex gap-3">
            {FILING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => store.setFilingStatus(option.value)}
                className={`
                  flex-1 py-2.5 rounded-md text-sm font-medium border transition-all duration-200
                  ${store.filingStatus === option.value
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.08)]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
