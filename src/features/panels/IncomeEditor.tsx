import { observer } from 'mobx-react-lite';
import { Building2, AlertTriangle } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';
import { NumberInput } from '../../components/NumberInput';

export const IncomeEditor = observer(function IncomeEditor() {
  const goalStore = useGoalStore();
  const ssBenefit = goalStore.ssMonthlyBenefit;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Building2 size={16} className="text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Income Source</div>
          <div className="text-[10px] text-zinc-500">Social Security Estimate</div>
        </div>
      </div>

      {/* Current Income */}
      <NumberInput
        label="Current Annual Income"
        value={goalStore.currentAnnualIncome}
        onChange={(v) => goalStore.setCurrentAnnualIncome(v)}
        prefix="$"
        suffix="/yr"
        step={5000}
        min={0}
      />

      {/* Claim Age Slider */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          SS Claim Age
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={goalStore.ssMinClaimAge}
            max={goalStore.ssMaxClaimAge}
            step={1}
            value={goalStore.ssClaimAge}
            onChange={(e) => goalStore.setSSClaimAge(Number(e.target.value))}
            className="flex-1 h-1 accent-blue-500 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
          />
          <span className="text-xs text-white tabular-nums w-6 text-right">{goalStore.ssClaimAge}</span>
        </div>
        <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5">
          <span>{goalStore.ssMinClaimAge} (early)</span>
          <span>67 (full)</span>
          <span>{goalStore.ssMaxClaimAge} (max)</span>
        </div>
      </div>

      {/* Gap Warning */}
      {goalStore.ssStartsAfterRetirement && (
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-[10px] text-amber-400/90 leading-relaxed">
            You&apos;ll need to rely on other investments for{' '}
            <span className="font-semibold text-amber-300">{goalStore.ssGapYears} year{goalStore.ssGapYears !== 1 ? 's' : ''}</span>{' '}
            until Social Security begins at age {goalStore.ssClaimAge}.
          </div>
        </div>
      )}

      {/* SS Estimate */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">SS Benefit Estimate</div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Monthly Benefit</span>
          <span className="text-blue-400 font-semibold tabular-nums">{formatCurrency(ssBenefit)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Annual Benefit</span>
          <span className="text-white tabular-nums">{formatCurrency(ssBenefit * 12)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Claim Age</span>
          <span className="text-white tabular-nums">{goalStore.ssClaimAge}</span>
        </div>
      </div>

      <div className="text-[10px] text-zinc-600 leading-relaxed">
        Estimate based on simplified PIA formula using current income as proxy for career average.
        Actual benefits depend on 35 highest-earning years.
        Claiming at 62 reduces benefits; full benefits at 67; delaying until 70 increases them.
      </div>
    </div>
  );
});
