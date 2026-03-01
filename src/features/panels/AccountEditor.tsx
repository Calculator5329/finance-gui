import { observer } from 'mobx-react-lite';
import { Briefcase } from 'lucide-react';
import type { Account, AccountType } from '../../core/types/account';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from '../../core/types/account';
import { useAccountStore, useGoalStore } from '../../stores/RootStore';
import { ProgressBar } from '../../components/ProgressBar';
import { calcRealReturn, formatCurrency } from '../../services/financialCalc';
import { NumberInput } from '../../components/NumberInput';

interface AccountEditorProps {
  accountId: string;
}

const ACCOUNT_TYPES: AccountType[] = ['401k', 'roth_ira', 'traditional_ira', 'pension', 'brokerage', 'savings'];

export const AccountEditor = observer(function AccountEditor({ accountId }: AccountEditorProps) {
  const accountStore = useAccountStore();
  const goalStore = useGoalStore();
  const account = accountStore.getAccount(accountId);

  if (!account) {
    return (
      <div className="p-4 text-zinc-500 text-xs">Account not found</div>
    );
  }

  const color = ACCOUNT_TYPE_COLORS[account.type];

  const update = (updates: Partial<Account>) => {
    accountStore.updateAccount(accountId, updates);
  };

  return (
    <div className="space-y-4">
      {/* Account header */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Briefcase size={16} style={{ color }} />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{account.name}</div>
          <div className="text-[10px] text-zinc-500">{account.provider}</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Name
        </label>
        <input
          type="text"
          value={account.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Account Type
        </label>
        <select
          value={account.type}
          onChange={(e) => update({ type: e.target.value as AccountType })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Provider
        </label>
        <input
          type="text"
          value={account.provider}
          onChange={(e) => update({ provider: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Balance */}
      <NumberInput
        label="Balance"
        value={account.balance}
        onChange={(v) => update({ balance: v })}
        prefix="$"
        step={1000}
      />

      {/* Contribution Percent */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Contribution (% of Disposable)
          </label>
          <span className="text-[10px] text-cyan-400 tabular-nums">
            {account.contributionPercent ?? 0}%
          </span>
        </div>
        <input
          type="range"
          value={account.contributionPercent ?? 0}
          onChange={(e) => update({ contributionPercent: Number(e.target.value) })}
          min={0}
          max={100}
          step={1}
          className="w-full accent-cyan-400"
        />
        <div className="text-[10px] text-zinc-600 mt-0.5">
          {formatCurrency(goalStore.monthlySavings * ((account.contributionPercent ?? 0) / 100))}/mo
          from {formatCurrency(goalStore.monthlySavings)} disposable
        </div>
      </div>

      {/* Annual return / Savings Yield */}
      <NumberInput
        label={account.type === 'savings' ? 'Savings Yield (APY)' : 'Nominal Annual Return'}
        value={Math.round(account.annualReturn * 100 * 10) / 10}
        onChange={(v) => update({ annualReturn: v / 100 })}
        suffix="%"
        step={0.1}
        min={0}
        max={30}
      />

      {/* Real return (read-only, inflation-adjusted) — hide for savings */}
      {account.type !== 'savings' && (
        <>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-md px-2.5 py-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Real Return (inflation adj.)
            </span>
            <span className="text-xs text-cyan-400 font-medium tabular-nums">
              {(calcRealReturn(account.annualReturn, goalStore.inflationRate) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-[9px] text-zinc-600 -mt-2">
            Nominal {(account.annualReturn * 100).toFixed(1)}% · Inflation {(goalStore.inflationRate * 100).toFixed(1)}%
          </div>
        </>
      )}

      {/* Max Balance Cap */}
      <NumberInput
        label="Max Balance (0 = unlimited)"
        value={account.maxBalance ?? 0}
        onChange={(v) => update({ maxBalance: Math.max(0, v) })}
        prefix="$"
        step={1000}
      />

      {/* Overflow Account */}
      {(account.maxBalance ?? 0) > 0 && (
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Overflow To
          </label>
          <select
            value={account.overflowAccountId ?? ''}
            onChange={(e) => update({ overflowAccountId: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
          >
            <option value="">None</option>
            {accountStore.accounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || ACCOUNT_TYPE_LABELS[a.type]}
                </option>
              ))}
          </select>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            When balance reaches {formatCurrency(account.maxBalance)}, contributions redirect here.
          </div>
        </div>
      )}

      {/* Vesting — hidden for savings/brokerage */}
      {account.type !== 'savings' && account.type !== 'brokerage' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Vesting
            </label>
            <span className="text-[10px] text-zinc-400 tabular-nums">
              {account.vestingPercent}%
            </span>
          </div>
          <input
            type="range"
            value={account.vestingPercent}
            onChange={(e) => update({ vestingPercent: Number(e.target.value) })}
            min={0}
            max={100}
            step={5}
            className="w-full accent-cyan-400"
          />
          <ProgressBar value={account.vestingPercent} color={color} height={3} className="mt-1" />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => accountStore.removeAccount(accountId)}
        className="w-full mt-2 py-1.5 text-xs font-medium text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors"
      >
        Remove Account
      </button>
    </div>
  );
});
