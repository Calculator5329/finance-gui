import { memo, useState, useCallback, useId } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { BarChart3 } from 'lucide-react';
import type { ChartNodeData } from '../../../core/types/node';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';
import type { YearProjection } from '../../../services/projectionCalc';

const CHART_W = 380;
const CHART_H = 180;
const PADDING = { top: 10, right: 10, bottom: 24, left: 0 };
const PLOT_W = CHART_W - PADDING.left - PADDING.right;
const PLOT_H = CHART_H - PADDING.top - PADDING.bottom;

function buildPath(
  projections: YearProjection[],
  getValue: (p: YearProjection) => number,
  maxVal: number,
): string {
  if (projections.length === 0) return '';
  return projections
    .map((p, i) => {
      const x = PADDING.left + (i / Math.max(projections.length - 1, 1)) * PLOT_W;
      const y = PADDING.top + PLOT_H - (getValue(p) / maxVal) * PLOT_H;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

function buildAreaPath(
  projections: YearProjection[],
  getValue: (p: YearProjection) => number,
  maxVal: number,
): string {
  const linePath = buildPath(projections, getValue, maxVal);
  if (!linePath) return '';
  const lastX = PADDING.left + PLOT_W;
  const firstX = PADDING.left;
  const baseY = PADDING.top + PLOT_H;
  return `${linePath} L${lastX},${baseY} L${firstX},${baseY} Z`;
}

const ChartNodeInner = observer(function ChartNodeInner({ data }: { data: ChartNodeData }) {
  const uid = useId();
  const goalStore = useGoalStore();
  const projections = goalStore.yearByYearProjection;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const showNominal = data.showNominal !== false;
  const showReal = data.showReal !== false;
  const showGoalLine = data.showGoalLine !== false;

  // Compute max value for scaling
  const maxVal = projections.reduce(
    (max, p) => Math.max(max, p.totalNominal, p.goalLine),
    1,
  );

  const nominalAreaPath = buildAreaPath(projections, (p) => p.totalNominal, maxVal);
  const realAreaPath = buildAreaPath(projections, (p) => p.totalReal, maxVal);
  const goalLinePath = buildPath(projections, (p) => p.goalLine, maxVal);
  const nominalLinePath = buildPath(projections, (p) => p.totalNominal, maxVal);
  const realLinePath = buildPath(projections, (p) => p.totalReal, maxVal);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (projections.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - PADDING.left;
      const idx = Math.round((x / PLOT_W) * (projections.length - 1));
      setHoverIdx(Math.max(0, Math.min(projections.length - 1, idx)));
    },
    [projections.length],
  );

  const hoverData = hoverIdx !== null ? projections[hoverIdx] : null;

  // X-axis labels (every ~5 years)
  const xLabels: { x: number; label: string }[] = [];
  if (projections.length > 0) {
    const step = Math.max(1, Math.floor(projections.length / 6));
    for (let i = 0; i < projections.length; i += step) {
      xLabels.push({
        x: PADDING.left + (i / Math.max(projections.length - 1, 1)) * PLOT_W,
        label: String(projections[i].age),
      });
    }
    // Always include last
    const last = projections.length - 1;
    if (!xLabels.find((l) => l.label === String(projections[last].age))) {
      xLabels.push({
        x: PADDING.left + PLOT_W,
        label: String(projections[last].age),
      });
    }
  }

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all duration-200" style={{ width: CHART_W + 20 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <BarChart3 size={14} className="text-cyan-400" />
        <span className="text-xs font-semibold text-white">{data.label || 'Projection Chart'}</span>
      </div>

      {/* Chart */}
      <div className="px-2 pb-1 relative">
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={`${uid}-nomGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${uid}-realGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={PADDING.left}
              y1={PADDING.top + PLOT_H * (1 - pct)}
              x2={PADDING.left + PLOT_W}
              y2={PADDING.top + PLOT_H * (1 - pct)}
              stroke="#27272a"
              strokeWidth="1"
            />
          ))}

          {/* Areas */}
          {showNominal && nominalAreaPath && (
            <path d={nominalAreaPath} fill={`url(#${uid}-nomGrad)`} />
          )}
          {showReal && realAreaPath && (
            <path d={realAreaPath} fill={`url(#${uid}-realGrad)`} />
          )}

          {/* Goal line */}
          {showGoalLine && goalLinePath && (
            <path
              d={goalLinePath}
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Lines */}
          {showNominal && nominalLinePath && (
            <path
              d={nominalLinePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
          {showReal && realLinePath && (
            <path
              d={realLinePath}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />
          )}

          {/* Hover crosshair */}
          {hoverIdx !== null && projections.length > 0 && (
            <>
              <line
                x1={PADDING.left + (hoverIdx / Math.max(projections.length - 1, 1)) * PLOT_W}
                y1={PADDING.top}
                x2={PADDING.left + (hoverIdx / Math.max(projections.length - 1, 1)) * PLOT_W}
                y2={PADDING.top + PLOT_H}
                stroke="#52525b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {showNominal && (
                <circle
                  cx={PADDING.left + (hoverIdx / Math.max(projections.length - 1, 1)) * PLOT_W}
                  cy={PADDING.top + PLOT_H - (projections[hoverIdx].totalNominal / maxVal) * PLOT_H}
                  r="3"
                  fill="#22d3ee"
                />
              )}
              {showReal && (
                <circle
                  cx={PADDING.left + (hoverIdx / Math.max(projections.length - 1, 1)) * PLOT_W}
                  cy={PADDING.top + PLOT_H - (projections[hoverIdx].totalReal / maxVal) * PLOT_H}
                  r="3"
                  fill="#a78bfa"
                />
              )}
            </>
          )}

          {/* X-axis labels */}
          {xLabels.map((l) => (
            <text
              key={l.label}
              x={l.x}
              y={CHART_H - 4}
              fill="#52525b"
              fontSize="9"
              textAnchor="middle"
            >
              {l.label}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hoverData && (
          <div className="absolute top-2 right-3 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-md px-2 py-1.5 text-[10px] space-y-0.5 pointer-events-none">
            <div className="text-zinc-400">Age {hoverData.age} ({hoverData.year})</div>
            {showNominal && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-zinc-300">Nominal: {formatCurrency(hoverData.totalNominal, true)}</span>
              </div>
            )}
            {showReal && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-zinc-300">Real: {formatCurrency(hoverData.totalReal, true)}</span>
              </div>
            )}
            {showGoalLine && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span className="text-zinc-400">Goal: {formatCurrency(hoverData.goalLine, true)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 pb-2">
        {showNominal && (
          <div className="flex items-center gap-1 text-[9px]">
            <span className="w-2 h-0.5 bg-cyan-400 rounded" />
            <span className="text-zinc-500">Nominal</span>
          </div>
        )}
        {showReal && (
          <div className="flex items-center gap-1 text-[9px]">
            <span className="w-2 h-0.5 bg-violet-400 rounded" />
            <span className="text-zinc-500">Real (inflation adj.)</span>
          </div>
        )}
        {showGoalLine && (
          <div className="flex items-center gap-1 text-[9px]">
            <span className="w-2 h-0.5 bg-zinc-500 rounded border-dashed" />
            <span className="text-zinc-500">Goal</span>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const ChartNode = memo(function ChartNode({ data }: NodeProps) {
  return <ChartNodeInner data={data as unknown as ChartNodeData} />;
});
