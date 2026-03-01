import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Receipt } from 'lucide-react';
import { useGoalStore } from '../../../stores/RootStore';
import { formatCurrency } from '../../../services/financialCalc';

const ExpensesNodeInner = observer(function ExpensesNodeInner() {
  const goalStore = useGoalStore();
  const monthly = goalStore.monthlyExpenses;
  const annual = monthly * 12;

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg min-w-[180px] hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center">
          <Receipt size={16} className="text-orange-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Expenses</div>
          <div className="text-[10px] text-zinc-500">Monthly spending</div>
        </div>
      </div>

      {/* Values */}
      <div className="px-3 pb-3 pt-2">
        <div className="text-lg font-bold text-orange-400 tabular-nums">
          {formatCurrency(monthly)}/mo
        </div>
        <div className="text-[10px] text-zinc-500 tabular-nums mt-0.5">
          {formatCurrency(annual)}/yr
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-orange-400 !border-zinc-900 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const ExpensesNode = memo(function ExpensesNode(_props: NodeProps) {
  return <ExpensesNodeInner />;
});
