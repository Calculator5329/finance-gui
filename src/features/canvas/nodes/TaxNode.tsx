import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Calculator } from 'lucide-react';
import { useTaxStore, useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';
import { FILING_STATUS_LABELS } from '../../../core/types/tax';

const TaxNodeInner = observer(function TaxNodeInner() {
  const taxStore = useTaxStore();
  const goalStore = useGoalStore();
  const breakdown = taxStore.breakdown;
  const grossMonthly = goalStore.estimatedMonthlyIncome;
  const alloc = taxStore.allocation;
  const totalAlloc = alloc.ordinary + alloc.ltcg + alloc.taxFree;

  // Income type proportions for the top mini bar
  const ordPct = totalAlloc > 0 ? (alloc.ordinary / totalAlloc) * 100 : 100;
  const ltcgPct = totalAlloc > 0 ? (alloc.ltcg / totalAlloc) * 100 : 0;
  const freePct = totalAlloc > 0 ? (alloc.taxFree / totalAlloc) * 100 : 0;

  // Tax proportions for the tax bar
  const total = breakdown.grossAnnual || 1;
  const fedOrdPct = (breakdown.federalOrdinary / total) * 100;
  const fedLtcgPct = (breakdown.federalLTCG / total) * 100;
  const niitPct = (breakdown.niit / total) * 100;
  const statePct = (breakdown.state / total) * 100;
  const netPct = Math.max(0, 100 - fedOrdPct - fedLtcgPct - niitPct - statePct);

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg min-w-[220px] hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
          <Calculator size={16} className="text-amber-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Tax Calculator</div>
          <div className="text-[10px] text-zinc-500">
            {FILING_STATUS_LABELS[taxStore.filingStatus]}
          </div>
        </div>
      </div>

      {/* Income type bar */}
      <div className="px-3 pt-1.5 pb-0.5">
        <div className="text-[8px] text-zinc-600 mb-0.5 uppercase tracking-wider">Income Mix</div>
        <div className="h-1.5 rounded-full overflow-hidden flex bg-zinc-800">
          {ordPct > 0 && (
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${ordPct}%`, backgroundColor: '#f59e0b' }}
              title={`Ordinary: ${ordPct.toFixed(0)}%`}
            />
          )}
          {ltcgPct > 0 && (
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${ltcgPct}%`, backgroundColor: '#8b5cf6' }}
              title={`LTCG: ${ltcgPct.toFixed(0)}%`}
            />
          )}
          {freePct > 0 && (
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${freePct}%`, backgroundColor: '#22c55e' }}
              title={`Tax-Free: ${freePct.toFixed(0)}%`}
            />
          )}
        </div>
        <div className="flex gap-2 mt-0.5">
          {ordPct > 0 && (
            <span className="text-[8px] text-amber-400/60">{ordPct.toFixed(0)}% Ord</span>
          )}
          {ltcgPct > 0 && (
            <span className="text-[8px] text-violet-400/60">{ltcgPct.toFixed(0)}% LTCG</span>
          )}
          {freePct > 0 && (
            <span className="text-[8px] text-emerald-400/60">{freePct.toFixed(0)}% Free</span>
          )}
        </div>
      </div>

      {/* Tax stacked bar */}
      <div className="mx-3 mt-1.5 mb-1.5">
        <div className="text-[8px] text-zinc-600 mb-0.5 uppercase tracking-wider">Tax Burden</div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-zinc-800">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${fedOrdPct}%`, backgroundColor: '#ef4444' }}
            title={`Fed Ordinary: ${formatCurrency(breakdown.federalOrdinary)}`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${fedLtcgPct}%`, backgroundColor: '#c084fc' }}
            title={`Fed LTCG: ${formatCurrency(breakdown.federalLTCG)}`}
          />
          {niitPct > 0.5 && (
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${niitPct}%`, backgroundColor: '#ec4899' }}
              title={`NIIT: ${formatCurrency(breakdown.niit)}`}
            />
          )}
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${statePct}%`, backgroundColor: '#f59e0b' }}
            title={`State: ${formatCurrency(breakdown.state)}`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${netPct}%`, backgroundColor: '#22c55e' }}
            title={`Net: ${formatCurrency(breakdown.netAnnual)}`}
          />
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="px-3 pb-3 space-y-0.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Gross In</span>
          <span className="text-zinc-300 tabular-nums">{formatCurrency(grossMonthly)}/mo</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-zinc-500">Fed Ordinary</span>
          </span>
          <span className="text-red-400 tabular-nums">-{formatCurrency(breakdown.federalOrdinary / 12)}</span>
        </div>
        {breakdown.federalLTCG > 0 && (
          <div className="flex justify-between text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-zinc-500">Fed LTCG</span>
            </span>
            <span className="text-violet-400 tabular-nums">-{formatCurrency(breakdown.federalLTCG / 12)}</span>
          </div>
        )}
        {breakdown.niit > 0 && (
          <div className="flex justify-between text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              <span className="text-zinc-500">NIIT 3.8%</span>
            </span>
            <span className="text-pink-400 tabular-nums">-{formatCurrency(breakdown.niit / 12)}</span>
          </div>
        )}
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-zinc-500">State ({(taxStore.stateRate * 100).toFixed(0)}%)</span>
          </span>
          <span className="text-amber-400 tabular-nums">-{formatCurrency(breakdown.state / 12)}</span>
        </div>
        <div className="h-px bg-zinc-800 my-0.5" />
        <div className="flex justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 font-medium">Net Out</span>
          </span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatCurrency(breakdown.netMonthly)}/mo
          </span>
        </div>
        <div className="text-[9px] text-zinc-600 text-right">
          Effective rate: {(breakdown.effectiveRate * 100).toFixed(1)}%
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-amber-400 !border-zinc-900 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-emerald-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const TaxNode = memo(function TaxNode(_props: NodeProps) {
  return <TaxNodeInner />;
});
