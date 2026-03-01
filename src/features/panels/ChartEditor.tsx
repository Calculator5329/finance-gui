import { observer } from 'mobx-react-lite';
import { BarChart3 } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';

export const ChartEditor = observer(function ChartEditor() {
  const goalStore = useGoalStore();
  const projections = goalStore.yearByYearProjection;

  const lastProjection = projections.length > 0 ? projections[projections.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <BarChart3 size={16} className="text-cyan-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Projection Chart</div>
          <div className="text-[10px] text-zinc-500">
            {projections.length} year projection
          </div>
        </div>
      </div>

      {/* Summary */}
      {lastProjection && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            At Retirement (Age {lastProjection.age})
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-zinc-400">Nominal Value</span>
            </span>
            <span className="text-cyan-400 tabular-nums font-medium">
              {formatCurrency(lastProjection.totalNominal, true)}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-zinc-400">Real Value</span>
            </span>
            <span className="text-violet-400 tabular-nums font-medium">
              {formatCurrency(lastProjection.totalReal, true)}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-zinc-400">Goal Line</span>
            </span>
            <span className="text-zinc-300 tabular-nums">
              {formatCurrency(lastProjection.goalLine, true)}
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-zinc-500 leading-relaxed">
        The chart shows projected portfolio growth from age {goalStore.goal.currentAge} to {goalStore.goal.targetAge}.
        The <span className="text-cyan-400">cyan line</span> is nominal value,
        the <span className="text-violet-400">violet line</span> is inflation-adjusted ({(goalStore.inflationRate * 100).toFixed(0)}% rate).
        Hover over the chart to see year-by-year details.
      </div>
    </div>
  );
});
