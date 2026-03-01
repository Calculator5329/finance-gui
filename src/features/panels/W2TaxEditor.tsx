import { observer } from 'mobx-react-lite';
import { Receipt, Info } from 'lucide-react';
import { useGoalStore, useTaxStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';
import { FILING_STATUS_LABELS, type FilingStatus } from '../../core/types/tax';
import { NumberInput } from '../../components/NumberInput';

const FILING_STATUSES: FilingStatus[] = ['single', 'married_joint', 'married_separate', 'head_of_household'];

export const W2TaxEditor = observer(function W2TaxEditor() {
  const goalStore = useGoalStore();
  const taxStore = useTaxStore();
  const breakdown = goalStore.w2TaxBreakdown;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Receipt size={16} className="text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">W-2 Income Tax</div>
          <div className="text-[10px] text-zinc-500">Working years tax calculation</div>
        </div>
      </div>

      {/* Gross Income */}
      <div>
        <NumberInput
          label="Gross Annual Income"
          value={goalStore.currentAnnualIncome}
          onChange={(v) => goalStore.setCurrentAnnualIncome(v)}
          prefix="$"
          suffix="/yr"
          step={1000}
          min={0}
        />
        <div className="text-[10px] text-zinc-600 mt-0.5">
          {formatCurrency(goalStore.currentAnnualIncome / 12)}/mo gross
        </div>
      </div>

      {/* Filing Status */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Filing Status
        </label>
        <select
          value={taxStore.filingStatus}
          onChange={(e) => taxStore.setFilingStatus(e.target.value as FilingStatus)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
        >
          {FILING_STATUSES.map((s) => (
            <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* State Tax Rate */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
            State Tax Rate
          </label>
          <span className="text-[10px] text-zinc-400 tabular-nums">
            {(taxStore.stateRate * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          value={taxStore.stateRate * 100}
          onChange={(e) => taxStore.setStateRate(Number(e.target.value) / 100)}
          min={0}
          max={13}
          step={0.1}
          className="w-full accent-blue-400"
        />
      </div>

      {/* Tax Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Tax Breakdown (Annual)</div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-400">Gross Income</span>
          </span>
          <span className="text-white tabular-nums">{formatCurrency(breakdown.grossAnnual)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-400">Federal Income Tax</span>
          </span>
          <span className="text-red-400 tabular-nums">-{formatCurrency(breakdown.federalIncome)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-400">State Tax</span>
          </span>
          <span className="text-amber-400 tabular-nums">-{formatCurrency(breakdown.state)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-zinc-400">Social Security</span>
          </span>
          <span className="text-violet-400 tabular-nums">-{formatCurrency(breakdown.socialSecurity)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-zinc-400">Medicare</span>
          </span>
          <span className="text-violet-400 tabular-nums">-{formatCurrency(breakdown.medicare)}</span>
        </div>

        {breakdown.medicareSurtax > 0 && (
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-zinc-400">Medicare Surtax</span>
            </span>
            <span className="text-pink-400 tabular-nums">-{formatCurrency(breakdown.medicareSurtax)}</span>
          </div>
        )}

        <div className="h-px bg-zinc-700 my-1" />

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-300 font-medium">Take-Home Pay</span>
          </span>
          <span className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(breakdown.netAnnual)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Monthly</span>
          <span className="text-emerald-400 tabular-nums">{formatCurrency(breakdown.netMonthly)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Effective Rate</span>
          <span className="text-zinc-300 tabular-nums">{(breakdown.effectiveRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-1.5 text-[10px] text-zinc-600 leading-relaxed">
        <Info size={12} className="shrink-0 mt-0.5 text-zinc-600" />
        <span>
          W-2 taxes include federal income tax (with standard deduction), state income tax,
          Social Security (6.2% up to $168,600), and Medicare (1.45% + 0.9% surtax above threshold).
        </span>
      </div>
    </div>
  );
});
