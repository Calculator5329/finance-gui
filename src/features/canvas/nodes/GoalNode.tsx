import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Target } from 'lucide-react';
import type { GoalNodeData } from '../../../core/types/node';
import { useGoalStore } from '../../../stores/RootStore';

const GoalNodeInner = observer(function GoalNodeInner({ data }: { data: GoalNodeData }) {
  const goalStore = useGoalStore();
  const goal = goalStore.goal;

  const field = data.label.toLowerCase();

  let displayLabel = data.label;
  let displayValue = '';

  if (field.includes('age') || field.includes('target age')) {
    displayLabel = 'Target Age';
    displayValue = String(goal.targetAge);
  } else if (field.includes('spending')) {
    displayLabel = 'Spending';
    displayValue = `$${goal.monthlySpending.toLocaleString()}/mo`;
  } else if (field.includes('savings') || field.includes('rate')) {
    displayLabel = 'Savings Rate';
    displayValue = `${(goal.savingsRate * 100).toFixed(0)}%`;
  } else {
    displayValue = data.label;
  }

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[130px] hover:border-zinc-700 transition-all duration-200">
      <div className="flex items-center gap-2 mb-1">
        <Target size={12} className="text-cyan-400" />
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{displayLabel}</span>
      </div>
      <div className="text-lg font-bold text-white tabular-nums">{displayValue}</div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const GoalNode = memo(function GoalNode({ data }: NodeProps) {
  return <GoalNodeInner data={data as unknown as GoalNodeData} />;
});
