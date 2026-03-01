import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { DollarSign } from 'lucide-react';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';

const GrossPayNodeInner = observer(function GrossPayNodeInner() {
  const goalStore = useGoalStore();
  const annual = goalStore.currentAnnualIncome;
  const monthly = annual / 12;

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg min-w-[180px] hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
          <DollarSign size={16} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Gross Pay</div>
          <div className="text-[10px] text-zinc-500">Annual income</div>
        </div>
      </div>

      {/* Values */}
      <div className="px-3 pb-3 pt-2">
        <div className="text-lg font-bold text-emerald-400 tabular-nums">
          {formatCurrency(annual, true)}
        </div>
        <div className="text-[10px] text-zinc-500 tabular-nums mt-0.5">
          {formatCurrency(monthly)}/mo
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-emerald-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const GrossPayNode = memo(function GrossPayNode(_props: NodeProps) {
  return <GrossPayNodeInner />;
});
