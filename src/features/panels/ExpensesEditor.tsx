import { observer } from 'mobx-react-lite';
import { Receipt, Info } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';
import { NumberInput } from '../../components/NumberInput';

export const ExpensesEditor = observer(function ExpensesEditor() {
  const goalStore = useGoalStore();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Receipt size={16} className="text-orange-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Expenses</div>
          <div className="text-[10px] text-zinc-500">Monthly spending & bills</div>
        </div>
      </div>

      {/* Monthly Expenses Input */}
      <div>
        <NumberInput
          label="Monthly Expenses"
          value={goalStore.monthlyExpenses}
          onChange={(v) => goalStore.setMonthlyExpenses(v)}
          prefix="$"
          suffix="/mo"
          step={100}
          min={0}
        />
        <div className="text-[10px] text-zinc-600 mt-0.5">
          {formatCurrency(goalStore.monthlyExpenses * 12)}/yr total
        </div>
      </div>

      {/* Summary */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-orange-400 uppercase tracking-wider">Summary</div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Monthly</span>
          <span className="text-orange-400 font-semibold tabular-nums">
            {formatCurrency(goalStore.monthlyExpenses)}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Annual</span>
          <span className="text-orange-400/70 tabular-nums">
            {formatCurrency(goalStore.monthlyExpenses * 12)}
          </span>
        </div>

        <div className="h-px bg-orange-500/10 my-1" />

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Take-Home Pay</span>
          <span className="text-zinc-300 tabular-nums">
            {formatCurrency(goalStore.takeHomePayMonthly)}/mo
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">After Expenses</span>
          <span className="text-cyan-400 font-semibold tabular-nums">
            {formatCurrency(goalStore.monthlySavings)}/mo
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-1.5 text-[10px] text-zinc-600 leading-relaxed">
        <Info size={12} className="shrink-0 mt-0.5 text-zinc-600" />
        <span>
          Enter your total monthly living expenses (rent, food, bills, etc.).
          The remaining amount after expenses is your disposable income,
          which gets distributed as contributions across your investment accounts.
        </span>
      </div>
    </div>
  );
});
