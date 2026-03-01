import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2 } from 'lucide-react';
import { useFlowStore, useAccountStore } from '../../stores/RootStore';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from '../../core/types/account';
import { AccountEditor } from './AccountEditor';
import { GoalEditor } from './GoalEditor';
import { TaxEditor } from './TaxEditor';
import { W2TaxEditor } from './W2TaxEditor';
import { GrossPayEditor } from './GrossPayEditor';
import { ExpensesEditor } from './ExpensesEditor';
import { EngineEditor } from './EngineEditor';
import { IncomeEditor } from './IncomeEditor';
import { VariableEditor } from './VariableEditor';

/**
 * Inline account selector shown when an account node has no linked account
 * (or the linked account was deleted).
 */
const AccountLinker = observer(function AccountLinker({ nodeId }: { nodeId: string }) {
  const accountStore = useAccountStore();
  const flowStore = useFlowStore();
  const accounts = accountStore.accounts;

  const handleLink = (accountId: string) => {
    flowStore.updateNodeData(nodeId, { accountId });
  };

  if (accounts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-500">
          <Link2 size={14} />
          <span className="text-xs font-medium">Link Account</span>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          No accounts exist yet. Add an account from the sidebar or through the onboarding wizard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400">
        <Link2 size={14} />
        <span className="text-xs font-medium">Link Account</span>
      </div>
      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Select an account to display in this node.
      </p>
      <div className="space-y-1.5">
        {accounts.map((acct) => {
          const color = ACCOUNT_TYPE_COLORS[acct.type];
          return (
            <button
              key={acct.id}
              onClick={() => handleLink(acct.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-zinc-900 border border-zinc-800 hover:border-cyan-500/40 hover:bg-zinc-800/80 transition-colors text-left group"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{acct.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {ACCOUNT_TYPE_LABELS[acct.type]}
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 group-hover:text-cyan-400 transition-colors">
                Link
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export const DetailPanel = observer(function DetailPanel() {
  const flowStore = useFlowStore();
  const accountStore = useAccountStore();
  const selectedNode = flowStore.selectedNode;

  const isOpen = !!selectedNode;

  const renderEditor = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'accountNode': {
        const data = selectedNode.data as { accountId?: string };
        const accountId = data.accountId || '';
        const accountExists = accountId ? accountStore.getAccount(accountId) : undefined;

        if (accountId && accountExists) {
          return <AccountEditor accountId={accountId} />;
        }

        // Show account selector for unlinked or orphaned nodes
        return <AccountLinker nodeId={selectedNode.id} />;
      }
      case 'goalNode':
        return <GoalEditor />;
      case 'taxNode':
        return <TaxEditor />;
      case 'incomeNode':
        return <IncomeEditor />;
      case 'variableNode': {
        const data = selectedNode.data as { key?: string };
        return <VariableEditor variableKey={data.key || ''} />;
      }
      case 'engineNode':
        return <EngineEditor />;
      case 'w2TaxNode':
        return <W2TaxEditor />;
      case 'grossPayNode':
        return <GrossPayEditor />;
      case 'expensesNode':
        return <ExpensesEditor />;
      case 'outputNode':
        return (
          <div className="p-4">
            <div className="text-sm font-medium text-white mb-2">Output Node</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Displays computed financial metrics from the connected engine node.
              Values update automatically when account data, goals, or tax settings change.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-zinc-900/80 backdrop-blur-md border-l border-zinc-800 overflow-hidden shrink-0 z-40"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Properties
              </h3>
              <button
                onClick={() => flowStore.selectNode(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderEditor()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
