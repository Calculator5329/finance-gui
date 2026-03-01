interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  prefix = '',
  suffix = '',
  step = 1,
  min = 0,
  max,
}: NumberInputProps) {
  return (
    <div>
      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden focus-within:border-cyan-500/50 transition-colors">
        {prefix && <span className="pl-2.5 text-xs text-zinc-500">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-2.5 text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
}
