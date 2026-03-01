import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Briefcase, Leaf, Shield, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import type { AccountNodeData } from '../../../core/types/node';
import type { AccountType } from '../../../core/types/account';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from '../../../core/types/account';
import { useAccountStore, useGoalStore } from '../../../stores/RootStore';
import { ProgressBar } from '../../../components/ProgressBar';
import { formatCurrency, calcRealReturn } from '../../../services/financialCalc';

const ACCOUNT_ICONS: Record<AccountType, React.ElementType> = {
  '401k': Briefcase,
  roth_ira: Leaf,
  traditional_ira: Shield,
  pension: TrendingUp,
  brokerage: Wallet,
  savings: PiggyBank,
};

const AccountNodeInner = observer(function AccountNodeInner({ data }: { data: AccountNodeData }) {
  const accountStore = useAccountStore();
  const goalStore = useGoalStore();
  const account = data.accountId ? accountStore.getAccount(data.accountId) : undefined;

  if (!account) {
    return (
      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-lg p-4 min-w-[180px]">
        <span className="text-zinc-500 text-xs">No account linked</span>
      </div>
    );
  }

  const Icon = ACCOUNT_ICONS[account.type] || Wallet;
  const color = ACCOUNT_TYPE_COLORS[account.type];
  const isSavings = account.type === 'savings';
  const overflowTarget = (account.maxBalance > 0 && account.overflowAccountId)
    ? accountStore.getAccount(account.overflowAccountId)
    : undefined;

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[180px] hover:border-zinc-700 transition-all duration-200 cursor-pointer">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        <div>
          <div className="text-xs font-medium text-white leading-tight">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </div>
          <div className="text-[10px] text-zinc-500">{account.provider || account.name}</div>
        </div>
      </div>

      {/* Balance */}
      <div className="text-base font-semibold text-white tabular-nums mb-0.5">
        {formatCurrency(account.balance)}
      </div>

      {/* Contribution info */}
      {(account.contributionPercent ?? 0) > 0 && (
        <div className="text-[10px] text-cyan-400 tabular-nums mb-0.5">
          {account.contributionPercent}% → {formatCurrency(goalStore.monthlySavings * (account.contributionPercent / 100))}/mo
        </div>
      )}

      {/* Return / Yield */}
      <div className="text-[10px] text-zinc-500 tabular-nums mb-0.5">
        {isSavings
          ? `${(account.annualReturn * 100).toFixed(1)}% APY`
          : `${(calcRealReturn(account.annualReturn, goalStore.inflationRate) * 100).toFixed(1)}% real return`
        }
      </div>

      {/* Max balance cap */}
      {account.maxBalance > 0 && (
        <div className="text-[10px] text-zinc-500 tabular-nums mb-0.5">
          Cap: {formatCurrency(account.maxBalance)}
          {overflowTarget && (
            <span className="text-amber-400"> → {ACCOUNT_TYPE_LABELS[overflowTarget.type]}</span>
          )}
        </div>
      )}

      {/* Vesting bar — hidden for savings/brokerage */}
      {account.type !== 'savings' && account.type !== 'brokerage' && account.vestingPercent < 100 && (
        <div className="flex items-center gap-2 mt-1">
          <ProgressBar value={account.vestingPercent} color={color} height={3} className="flex-1" />
          <span className="text-[10px] text-zinc-500 tabular-nums">
            {account.vestingPercent}% Vested
          </span>
        </div>
      )}

      {account.type !== 'savings' && account.type !== 'brokerage' && account.vestingPercent >= 100 && (
        <ProgressBar value={100} color={color} height={3} className="mt-1" />
      )}

      {/* Target handle (left side, for disposable income) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
      {/* Source handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-zinc-900 !border-2"
      />
    </div>
  );
});

export const AccountNode = memo(function AccountNode({ data }: NodeProps) {
  return <AccountNodeInner data={data as unknown as AccountNodeData} />;
});
