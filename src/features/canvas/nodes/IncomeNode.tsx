import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Building2, TrendingUp, Wallet, Leaf } from 'lucide-react';
import type { IncomeNodeData, IncomeSourceType } from '../../../core/types/node';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';

const SOURCE_ICONS: Record<IncomeSourceType, React.ElementType> = {
  social_security: Building2,
  pension_income: TrendingUp,
  '401k_drawdown': Wallet,
  roth_drawdown: Leaf,
};

const SOURCE_COLORS: Record<IncomeSourceType, string> = {
  social_security: '#3b82f6',
  pension_income: '#f59e0b',
  '401k_drawdown': '#ef4444',
  roth_drawdown: '#22c55e',
};

const SOURCE_LABELS: Record<IncomeSourceType, string> = {
  social_security: 'Social Security',
  pension_income: 'Pension',
  '401k_drawdown': '401(k) Drawdown',
  roth_drawdown: 'Roth Drawdown',
};

const IncomeNodeInner = observer(function IncomeNodeInner({ data }: { data: IncomeNodeData }) {
  const goalStore = useGoalStore();
  const Icon = SOURCE_ICONS[data.sourceType] || Wallet;
  const color = SOURCE_COLORS[data.sourceType] || '#22d3ee';
  const label = SOURCE_LABELS[data.sourceType] || data.label;

  let amount = data.monthlyAmount;
  let isEstimated = false;
  if (data.sourceType === 'social_security' && (data.autoEstimate || data.monthlyAmount === 0)) {
    amount = goalStore.ssMonthlyBenefit;
    isEstimated = true;
  }

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[160px] hover:border-zinc-700 transition-all duration-200">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        <div>
          <div className="text-xs font-medium text-white">{label}</div>
          <div className="text-[10px] text-zinc-500 tabular-nums">
            {formatCurrency(amount)}/mo
            {isEstimated && (
              <span className="ml-1 text-[9px] text-cyan-500/60">est.</span>
            )}
          </div>
        </div>
      </div>

      {/* Show claim age info for SS */}
      {data.sourceType === 'social_security' && (
        <div className="mt-2 text-[9px] text-zinc-600">
          Claiming at age {goalStore.ssClaimAge}
          {goalStore.ssStartsAfterRetirement && (
            <span className="block text-amber-500/70">
              Starts {goalStore.ssGapYears}yr after retirement
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const IncomeNode = memo(function IncomeNode({ data }: NodeProps) {
  return <IncomeNodeInner data={data as unknown as IncomeNodeData} />;
});
