import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Receipt } from 'lucide-react';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';

const W2TaxNodeInner = observer(function W2TaxNodeInner() {
  const goalStore = useGoalStore();
  const breakdown = goalStore.w2TaxBreakdown;
  const grossMonthly = goalStore.currentAnnualIncome / 12;

  // Tax proportions for the stacked bar
  const total = breakdown.grossAnnual || 1;
  const fedPct = (breakdown.federalIncome / total) * 100;
  const statePct = (breakdown.state / total) * 100;
  const ficaPct = (breakdown.totalFICA / total) * 100;
  const netPct = Math.max(0, 100 - fedPct - statePct - ficaPct);

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg min-w-[220px] hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
          <Receipt size={16} className="text-blue-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">W-2 Income Tax</div>
          <div className="text-[10px] text-zinc-500">
            Working years
          </div>
        </div>
      </div>

      {/* Tax stacked bar */}
      <div className="mx-3 mt-2 mb-1.5">
        <div className="text-[8px] text-zinc-600 mb-0.5 uppercase tracking-wider">Tax Burden</div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-zinc-800">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${fedPct}%`, backgroundColor: '#ef4444' }}
            title={`Federal: ${formatCurrency(breakdown.federalIncome)}`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${statePct}%`, backgroundColor: '#f59e0b' }}
            title={`State: ${formatCurrency(breakdown.state)}`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${ficaPct}%`, backgroundColor: '#8b5cf6' }}
            title={`FICA: ${formatCurrency(breakdown.totalFICA)}`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${netPct}%`, backgroundColor: '#22c55e' }}
            title={`Take-Home: ${formatCurrency(breakdown.netAnnual)}`}
          />
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="px-3 pb-2 space-y-0.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Gross</span>
          <span className="text-zinc-300 tabular-nums">{formatCurrency(grossMonthly)}/mo</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-zinc-500">Federal</span>
          </span>
          <span className="text-red-400 tabular-nums">-{formatCurrency(breakdown.federalIncome / 12)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-zinc-500">State</span>
          </span>
          <span className="text-amber-400 tabular-nums">-{formatCurrency(breakdown.state / 12)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="text-zinc-500">FICA</span>
          </span>
          <span className="text-violet-400 tabular-nums">-{formatCurrency(breakdown.totalFICA / 12)}</span>
        </div>
        <div className="h-px bg-zinc-800 my-0.5" />
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 font-medium">Take-Home</span>
          </span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatCurrency(breakdown.netMonthly)}/mo
          </span>
        </div>
      </div>

      <div className="text-[9px] text-zinc-600 text-right px-3 pb-2 mt-1">
        Effective rate: {(breakdown.effectiveRate * 100).toFixed(1)}%
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-400 !border-zinc-900 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const W2TaxNode = memo(function W2TaxNode(_props: NodeProps) {
  return <W2TaxNodeInner />;
});
