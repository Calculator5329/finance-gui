import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Briefcase,
  Leaf,
  Shield,
  TrendingUp,
  Wallet,
  PiggyBank,
  Cog,
  DollarSign,
  Target,
  Banknote,
  Receipt,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import type { FinanceNodeType } from '../../core/types/node';
import { useFlowStore } from '../../stores/RootStore';

interface PaletteCategory {
  label: string;
  icon: React.ElementType;
  items: PaletteItem[];
}

export interface PaletteItem {
  type: FinanceNodeType;
  label: string;
  icon: React.ElementType;
  color: string;
  /** Extra data to pass through dataTransfer for proper node creation */
  defaultData?: Record<string, unknown>;
  /**
   * If true, only one instance of this node is allowed on the canvas.
   * When one exists, the item is hidden from the palette.
   */
  singleton?: boolean;
  /** Function to detect if this singleton already exists on the canvas */
  singletonCheck?: (nodes: { type: string; data: Record<string, unknown> }[]) => boolean;
}

const PALETTE: PaletteCategory[] = [
  {
    label: 'Accounts',
    icon: Wallet,
    items: [
      { type: 'accountNode', label: '401(k)', icon: Briefcase, color: '#ef4444', defaultData: { accountType: '401k' } },
      { type: 'accountNode', label: 'Roth IRA', icon: Leaf, color: '#22c55e', defaultData: { accountType: 'roth_ira' } },
      { type: 'accountNode', label: 'Traditional IRA', icon: Shield, color: '#3b82f6', defaultData: { accountType: 'traditional_ira' } },
      { type: 'accountNode', label: 'Pension', icon: TrendingUp, color: '#f59e0b', defaultData: { accountType: 'pension' } },
      { type: 'accountNode', label: 'Brokerage', icon: Wallet, color: '#8b5cf6', defaultData: { accountType: 'brokerage' } },
      { type: 'accountNode', label: 'Savings', icon: PiggyBank, color: '#06b6d4', defaultData: { accountType: 'savings' } },
    ],
  },
  {
    label: 'Income Pipeline',
    icon: DollarSign,
    items: [
      {
        type: 'grossPayNode', label: 'Gross Pay', icon: DollarSign, color: '#22c55e',
        singleton: true,
        singletonCheck: (nodes) => nodes.some((n) => n.type === 'grossPayNode'),
      },
      {
        type: 'expensesNode', label: 'Expenses', icon: Receipt, color: '#f59e0b',
        singleton: true,
        singletonCheck: (nodes) => nodes.some((n) => n.type === 'expensesNode'),
      },
    ],
  },
  {
    label: 'Processing',
    icon: Cog,
    items: [
      {
        type: 'engineNode', label: 'Plan Engine', icon: Cog, color: '#22d3ee',
        singleton: true,
        singletonCheck: (nodes) => nodes.some((n) => n.type === 'engineNode'),
      },
      {
        type: 'w2TaxNode', label: 'W-2 Income Tax', icon: Receipt, color: '#3b82f6',
        singleton: true,
        singletonCheck: (nodes) => nodes.some((n) => n.type === 'w2TaxNode'),
      },
    ],
  },
  {
    label: 'Variables',
    icon: SlidersHorizontal,
    items: [
      {
        type: 'variableNode', label: 'Inflation Rate', icon: SlidersHorizontal, color: '#a78bfa',
        defaultData: { key: 'inflationRate' },
        singleton: true,
        singletonCheck: (nodes) => nodes.some((n) => n.type === 'variableNode' && (n.data as Record<string, unknown>).key === 'inflationRate'),
      },
    ],
  },
  {
    label: 'Output',
    icon: DollarSign,
    items: [
      { type: 'outputNode', label: 'Take-Home Pay', icon: Wallet, color: '#22c55e', defaultData: { metric: 'take_home_pay' } },
      { type: 'outputNode', label: 'Disposable Income', icon: PiggyBank, color: '#22d3ee', defaultData: { metric: 'disposable_income' } },
      { type: 'outputNode', label: 'Net Worth', icon: DollarSign, color: '#22d3ee', defaultData: { metric: 'net_worth' } },
      { type: 'outputNode', label: 'Goal Status', icon: Target, color: '#22c55e', defaultData: { metric: 'goal_status' } },
      { type: 'outputNode', label: 'Gross Monthly', icon: Banknote, color: '#f59e0b', defaultData: { metric: 'monthly_income' } },
      { type: 'outputNode', label: 'Net Monthly', icon: ShieldCheck, color: '#22c55e', defaultData: { metric: 'net_monthly_income' } },
      { type: 'chartNode', label: 'Projection Chart', icon: BarChart3, color: '#22d3ee' },
    ],
  },
];

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const onDragStart = useCallback(
    (event: React.DragEvent) => {
      // Serialize type + label + extra data into a single JSON payload
      const payload = JSON.stringify({
        type: item.type,
        label: item.label,
        defaultData: item.defaultData || {},
      });
      event.dataTransfer.setData('application/reactflow', payload);
      event.dataTransfer.effectAllowed = 'move';
    },
    [item.type, item.label, item.defaultData],
  );

  const Icon = item.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-zinc-800/60 transition-colors group"
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${item.color}15` }}
      >
        <Icon size={12} style={{ color: item.color }} />
      </div>
      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
        {item.label}
      </span>
    </div>
  );
}

export const NodePalette = observer(function NodePalette() {
  const flowStore = useFlowStore();
  const currentNodes = flowStore.nodes;

  return (
    <div className="space-y-3">
      {PALETTE.map((category) => {
        const CategoryIcon = category.icon;

        // Filter out singleton items that already exist on canvas
        const visibleItems = category.items.filter((item) => {
          if (!item.singleton || !item.singletonCheck) return true;
          return !item.singletonCheck(currentNodes as unknown as { type: string; data: Record<string, unknown> }[]);
        });

        // Don't render the category header if all items are hidden
        if (visibleItems.length === 0) return null;

        return (
          <div key={category.label}>
            <div className="flex items-center gap-1.5 px-2.5 py-1">
              <CategoryIcon size={10} className="text-zinc-600" />
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                {category.label}
              </span>
            </div>
            <div>
              {visibleItems.map((item, i) => (
                <DraggablePaletteItem key={`${item.type}-${item.label}-${i}`} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
