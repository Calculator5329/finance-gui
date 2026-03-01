import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { DollarSign, Target, Banknote, ShieldCheck, Wallet, PiggyBank } from 'lucide-react';
import type { OutputNodeData, OutputMetric } from '../../../core/types/node';
import { useGoalStore, useTaxStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';
import { GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../../core/types/goal';

const METRIC_ICONS: Record<OutputMetric, React.ElementType> = {
  net_worth: DollarSign,
  goal_status: Target,
  monthly_income: Banknote,
  net_monthly_income: ShieldCheck,
  take_home_pay: Wallet,
  disposable_income: PiggyBank,
};

const OutputNodeInner = observer(function OutputNodeInner({ data }: { data: OutputNodeData }) {
  const goalStore = useGoalStore();
  const taxStore = useTaxStore();

  let displayLabel = data.label;
  let displayValue = '';
  let statusColor = '#22d3ee';
  let subtitle = '';
  let inflationAdjusted = '';
  let inflationAdjustedLabel = '';

  switch (data.metric) {
    case 'net_worth':
      displayLabel = 'Ending Net Worth:';
      displayValue = formatCurrency(goalStore.endingNetWorth, true);
      statusColor = '#22d3ee';
      subtitle = `Projected at age ${goalStore.goal.targetAge}`;
      inflationAdjusted = formatCurrency(goalStore.endingNetWorthReal, true);
      inflationAdjustedLabel = 'In Today\'s Dollars:';
      break;
    case 'goal_status': {
      const progress = goalStore.progress;
      displayLabel = 'Goal Status:';
      displayValue = GOAL_STATUS_LABELS[progress.status];
      statusColor = GOAL_STATUS_COLORS[progress.status];
      if (goalStore.goal.monthlySpending > 0 && goalStore.yearsToRetirement > 0) {
        subtitle = `${formatCurrency(goalStore.realNetRetirementIncome)}/mo of ${formatCurrency(goalStore.goal.monthlySpending)}/mo spending`;
      }
      break;
    }
    case 'monthly_income':
      displayLabel = 'Gross Monthly Income:';
      displayValue = formatCurrency(goalStore.estimatedMonthlyIncome);
      statusColor = '#f59e0b';
      inflationAdjusted = formatCurrency(goalStore.realMonthlyIncome);
      inflationAdjustedLabel = 'Inflation-Adjusted:';
      break;
    case 'net_monthly_income':
      displayLabel = 'Net Monthly Income:';
      displayValue = formatCurrency(taxStore.netMonthlyIncome);
      statusColor = '#22c55e';
      subtitle = `${(taxStore.effectiveRate * 100).toFixed(1)}% effective tax`;
      inflationAdjusted = formatCurrency(goalStore.realNetRetirementIncome);
      inflationAdjustedLabel = 'Inflation-Adjusted:';
      break;
    case 'take_home_pay':
      displayLabel = 'Take-Home Pay:';
      displayValue = formatCurrency(goalStore.takeHomePayMonthly);
      statusColor = '#22c55e';
      subtitle = `${formatCurrency(goalStore.takeHomePayAnnual)}/yr after tax`;
      break;
    case 'disposable_income':
      displayLabel = 'Disposable Income:';
      displayValue = formatCurrency(goalStore.monthlySavings);
      statusColor = '#22d3ee';
      subtitle = `${(goalStore.computedSavingsRate * 100).toFixed(1)}% savings rate`;
      break;
  }

  const Icon = METRIC_ICONS[data.metric];

  return (
    <div
      className="bg-zinc-900/70 backdrop-blur-md border rounded-lg p-3 min-w-[160px] transition-all duration-200 hover:border-zinc-600"
      style={{ borderColor: `${statusColor}30` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} style={{ color: statusColor }} />
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{displayLabel}</span>
      </div>
      <div
        className="text-lg font-bold tabular-nums"
        style={{ color: statusColor }}
      >
        {displayValue}
      </div>
      {subtitle && (
        <div className="text-[9px] text-zinc-600 mt-0.5">{subtitle}</div>
      )}

      {inflationAdjusted && (
        <div
          className="mt-2 pt-2 border-t border-zinc-700/50"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{inflationAdjustedLabel}</span>
          </div>
          <div className="text-base font-bold tabular-nums text-amber-400">
            {inflationAdjusted}
          </div>
        </div>
      )}

      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
      {/* Source handle (for chaining, e.g. gross -> tax) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const OutputNode = memo(function OutputNode({ data }: NodeProps) {
  return <OutputNodeInner data={data as unknown as OutputNodeData} />;
});
