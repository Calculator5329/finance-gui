import { observer } from 'mobx-react-lite';
import { Target } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../core/types/goal';
import { ProgressBar } from '../../components/ProgressBar';
import { formatCurrency } from '../../services/financialCalc';
import { NumberInput } from '../../components/NumberInput';

export const GoalEditor = observer(function GoalEditor() {
  const goalStore = useGoalStore();
  const goal = goalStore.goal;
  const progress = goalStore.progress;
  const statusColor = GOAL_STATUS_COLORS[progress.status];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Target size={16} className="text-cyan-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Retirement Goal</div>
          <div className="text-[10px]" style={{ color: statusColor }}>
            {GOAL_STATUS_LABELS[progress.status]}
          </div>
        </div>
      </div>

      {/* Progress — income vs spending */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Income Coverage</span>
          <span className="text-[10px] tabular-nums" style={{ color: statusColor }}>
            {progress.percent.toFixed(0)}%
          </span>
        </div>
        <ProgressBar value={progress.percent} color={statusColor} height={4} />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-zinc-500">
            Net income: {formatCurrency(goalStore.realNetRetirementIncome)}/mo
          </span>
          <span className="text-[10px] text-zinc-500">
            Spending: {formatCurrency(goal.monthlySpending)}/mo
          </span>
        </div>
      </div>

      {/* Fields */}
      <NumberInput
        label="Current Age"
        value={goal.currentAge}
        onChange={(v) => goalStore.updateGoal({ currentAge: v })}
        suffix="years"
        min={18}
        max={80}
      />

      <NumberInput
        label="Target Retirement Age"
        value={goal.targetAge}
        onChange={(v) => goalStore.updateGoal({ targetAge: v })}
        suffix="years"
        min={goal.currentAge + 1}
        max={100}
      />

      {/* Target Amount (auto-computed from spending needs + taxes) */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Required Savings
        </label>
        <div className="flex items-center bg-zinc-900/40 border border-zinc-800 rounded-md px-2.5 py-1.5">
          <span className="text-xs text-zinc-500">$</span>
          <span className="flex-1 text-xs text-zinc-300 tabular-nums px-1">
            {formatCurrency(goalStore.requiredSavings).replace('$', '')}
          </span>
          <span className="text-[9px] text-zinc-600">auto</span>
        </div>
        <p className="text-[9px] text-zinc-600 mt-0.5 leading-relaxed">
          Savings needed so 4% withdrawals cover spending after taxes.
        </p>
      </div>

      <NumberInput
        label="Monthly Retirement Spending"
        value={goal.monthlySpending}
        onChange={(v) => goalStore.updateGoal({ monthlySpending: v })}
        prefix="$"
        suffix="/mo"
        step={100}
      />

      {/* Summary */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Summary</div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Years to retirement</span>
          <span className="text-white tabular-nums">{goalStore.yearsToRetirement}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Est. monthly income</span>
          <span className="text-white tabular-nums">
            {formatCurrency(goalStore.estimatedMonthlyIncome)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Inflation-adj. net income</span>
          <span className="tabular-nums" style={{ color: statusColor }}>
            {formatCurrency(goalStore.realNetRetirementIncome)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Projected savings</span>
          <span className="text-white tabular-nums">
            {formatCurrency(progress.projectedAmount, true)}
          </span>
        </div>
      </div>
    </div>
  );
});
