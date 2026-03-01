import { observer } from 'mobx-react-lite';
import { DollarSign, Info } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';
import { NumberInput } from '../../components/NumberInput';

export const GrossPayEditor = observer(function GrossPayEditor() {
  const goalStore = useGoalStore();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <DollarSign size={16} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Gross Pay</div>
          <div className="text-[10px] text-zinc-500">Your pre-tax annual income</div>
        </div>
      </div>

      {/* Annual Income Input */}
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

      {/* Summary */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Summary</div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Annual</span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatCurrency(goalStore.currentAnnualIncome)}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Monthly</span>
          <span className="text-emerald-400/70 tabular-nums">
            {formatCurrency(goalStore.currentAnnualIncome / 12)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-1.5 text-[10px] text-zinc-600 leading-relaxed">
        <Info size={12} className="shrink-0 mt-0.5 text-zinc-600" />
        <span>
          Enter your total gross annual income before any taxes or deductions.
          This feeds into the W-2 tax calculator to determine your take-home pay.
        </span>
      </div>
    </div>
  );
});
