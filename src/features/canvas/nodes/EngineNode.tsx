import { memo, useId } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Cog, TrendingUp } from 'lucide-react';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';

const EngineNodeInner = observer(function EngineNodeInner() {
  const uid = useId();
  const goalStore = useGoalStore();
  const projections = goalStore.yearByYearProjection;
  const projected = goalStore.progress.projectedAmount;
  const realProjected = goalStore.realProjectedAmount;

  const chartW = 200;
  const chartH = 80;

  // Build paths from real projection data
  const maxVal = projections.reduce(
    (max, p) => Math.max(max, p.totalNominal, p.goalLine),
    1,
  );

  const nominalPoints: string[] = [];
  const realPoints: string[] = [];
  const goalPoints: string[] = [];

  for (let i = 0; i < projections.length; i++) {
    const x = (i / Math.max(projections.length - 1, 1)) * chartW;
    const yNom = chartH - (projections[i].totalNominal / maxVal) * chartH * 0.9;
    const yReal = chartH - (projections[i].totalReal / maxVal) * chartH * 0.9;
    const yGoal = chartH - (projections[i].goalLine / maxVal) * chartH * 0.9;
    nominalPoints.push(`${x},${Math.max(2, yNom)}`);
    realPoints.push(`${x},${Math.max(2, yReal)}`);
    goalPoints.push(`${x},${Math.max(2, yGoal)}`);
  }

  const nomLine = nominalPoints.join(' ');
  const realLine = realPoints.join(' ');
  const goalLine = goalPoints.join(' ');
  const nomArea = nominalPoints.length
    ? `0,${chartH} ${nomLine} ${chartW},${chartH}`
    : '';
  const realArea = realPoints.length
    ? `0,${chartH} ${realLine} ${chartW},${chartH}`
    : '';

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg min-w-[240px] hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center">
          <Cog size={16} className="text-cyan-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Retirement Plan Engine</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="px-3 pb-2">
        <svg width={chartW} height={chartH} className="w-full" viewBox={`0 0 ${chartW} ${chartH}`}>
          {/* Goal line (dashed) */}
          {goalLine && (
            <polyline
              points={goalLine}
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Nominal area */}
          {nomArea && (
            <polygon points={nomArea} fill={`url(#${uid}-nomGrad)`} opacity="0.3" />
          )}

          {/* Real area */}
          {realArea && (
            <polygon points={realArea} fill={`url(#${uid}-realGrad)`} opacity="0.2" />
          )}

          {/* Nominal line */}
          {nomLine && (
            <polyline
              points={nomLine}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Real line */}
          {realLine && (
            <polyline
              points={realLine}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 2"
            />
          )}

          <defs>
            <linearGradient id={`${uid}-nomGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${uid}-realGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-3 pb-3">
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp size={10} className="text-cyan-400" />
          <span className="text-zinc-400">Nominal:</span>
          <span className="text-white font-medium tabular-nums">
            {formatCurrency(projected, true)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp size={10} className="text-violet-400" />
          <span className="text-zinc-400">Real:</span>
          <span className="text-violet-300 font-medium tabular-nums">
            {formatCurrency(realProjected, true)}
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const EngineNode = memo(function EngineNode(_props: NodeProps) {
  return <EngineNodeInner />;
});
