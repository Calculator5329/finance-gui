import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { SlidersHorizontal } from 'lucide-react';
import type { VariableNodeData } from '../../../core/types/node';
import { useGoalStore } from '../../../stores/RootStore';

const VariableNodeInner = observer(function VariableNodeInner({ data }: { data: VariableNodeData }) {
  const goalStore = useGoalStore();

  // Read live value from the store based on key
  let liveValue = data.value;
  if (data.key === 'inflationRate') {
    liveValue = goalStore.inflationRate * 100; // display as percent
  }

  const handleChange = useCallback(
    (newValue: number) => {
      if (data.key === 'inflationRate') {
        goalStore.setInflationRate(newValue / 100);
      }
    },
    [data.key, goalStore],
  );

  const displayValue =
    data.suffix === '%'
      ? `${liveValue.toFixed(1)}${data.suffix}`
      : `${liveValue}${data.suffix}`;

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[150px] hover:border-zinc-700 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal size={12} className="text-violet-400" />
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
          {data.label}
        </span>
      </div>

      <div className="text-lg font-bold text-white tabular-nums mb-2">{displayValue}</div>

      <input
        type="range"
        value={liveValue}
        onChange={(e) => handleChange(Number(e.target.value))}
        min={data.min}
        max={data.max}
        step={data.step}
        className="w-full accent-violet-400 h-1"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-violet-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const VariableNode = memo(function VariableNode({ data }: NodeProps) {
  return <VariableNodeInner data={data as unknown as VariableNodeData} />;
});
