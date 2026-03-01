import { observer } from 'mobx-react-lite';
import { Menu, Workflow } from 'lucide-react';
import { useAccountStore } from '../stores/RootStore';
import { formatCurrency } from '../services/financialCalc';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = observer(function Header({ onToggleSidebar }: HeaderProps) {
  const accountStore = useAccountStore();

  return (
    <header className="h-12 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Workflow size={18} className="text-cyan-400" />
          <h1 className="text-sm font-semibold tracking-wide text-white">
            Financial Workflow Dashboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Net Worth</span>
          <span className="text-white font-medium tabular-nums">
            {formatCurrency(accountStore.netWorth)}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <button className="px-3 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md hover:bg-cyan-500/20 transition-colors">
          AI Dashboard
        </button>
      </div>
    </header>
  );
});
