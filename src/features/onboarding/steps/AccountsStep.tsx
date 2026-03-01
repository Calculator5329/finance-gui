import { observer } from 'mobx-react-lite';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import type { OnboardingStore } from '../../../stores/OnboardingStore';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../../../core/types/account';

interface AccountsStepProps {
  store: OnboardingStore;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = (
  Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]
).map(([value, label]) => ({ value, label }));

export const AccountsStep = observer(function AccountsStep({ store }: AccountsStepProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">
            Investment Accounts
          </h2>
          <p className="text-zinc-500 text-xs">
            Add your retirement & investment accounts.
          </p>
        </div>
      </div>

      {/* Account list */}
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
        {store.accounts.length === 0 && (
          <div className="text-center py-6">
            <p className="text-zinc-500 text-xs mb-1">No accounts added yet.</p>
            <p className="text-zinc-600 text-[10px]">
              Click the button below to add your first account.
            </p>
          </div>
        )}

        {store.accounts.map((account) => (
          <div
            key={account.id}
            className="bg-zinc-800/40 border border-zinc-800/60 rounded-lg p-3 space-y-2.5"
          >
            {/* Row 1: Name + Type + Delete */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={account.name}
                onChange={(e) =>
                  store.updateAccount(account.id, { name: e.target.value })
                }
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                placeholder="Account name"
              />
              <select
                value={account.type}
                onChange={(e) =>
                  store.updateAccount(account.id, {
                    type: e.target.value as AccountType,
                  })
                }
                className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white focus:border-cyan-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => store.removeAccount(account.id)}
                className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove account"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Row 2: Balance + Contribution % */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">
                  Balance
                </label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                  <span className="pl-2 text-[10px] text-zinc-500">$</span>
                  <input
                    type="number"
                    min={0}
                    value={account.balance || ''}
                    onChange={(e) =>
                      store.updateAccount(account.id, {
                        balance: Number(e.target.value),
                      })
                    }
                    className="flex-1 bg-transparent px-1.5 py-1 text-xs text-white tabular-nums placeholder-zinc-600 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">
                  % of Disposable Income
                </label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={account.contributionPercent || ''}
                    onChange={(e) =>
                      store.updateAccount(account.id, {
                        contributionPercent: Number(e.target.value),
                      })
                    }
                    className="flex-1 bg-transparent px-1.5 py-1 text-xs text-white tabular-nums placeholder-zinc-600 focus:outline-none"
                    placeholder="0"
                  />
                  <span className="pr-2 text-[10px] text-zinc-500">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add account button */}
      <button
        onClick={() => store.addAccount()}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-zinc-700 text-zinc-400 text-xs font-medium hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-200"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Account
      </button>
    </div>
  );
});
