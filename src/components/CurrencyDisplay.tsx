import { formatCurrency } from '../services/financialCalc';

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg font-semibold',
};

export function CurrencyDisplay({
  amount,
  compact = false,
  className = '',
  prefix = '',
  suffix = '',
  size = 'md',
}: CurrencyDisplayProps) {
  return (
    <span className={`tabular-nums text-white ${SIZE_CLASSES[size]} ${className}`}>
      {prefix}
      {formatCurrency(amount, compact)}
      {suffix}
    </span>
  );
}
