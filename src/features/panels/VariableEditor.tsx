import { observer } from 'mobx-react-lite';
import { SlidersHorizontal } from 'lucide-react';
import { useGoalStore } from '../../stores/RootStore';
import { NumberInput } from '../../components/NumberInput';

interface VariableEditorProps {
  variableKey: string;
}

export const VariableEditor = observer(function VariableEditor({ variableKey }: VariableEditorProps) {
  const goalStore = useGoalStore();

  let label = 'Variable';
  let value = 0;
  let suffix = '';
  let min = 0;
  let max = 10;
  let step = 0.1;
  let description = '';

  if (variableKey === 'inflationRate') {
    label = 'Inflation Rate';
    value = goalStore.inflationRate * 100;
    suffix = '%';
    min = 0;
    max = 10;
    step = 0.1;
    description = 'The expected annual inflation rate. Used to convert nominal projections into today\'s purchasing power. Historical US average is ~3%.';
  }

  const handleChange = (newValue: number) => {
    if (variableKey === 'inflationRate') {
      goalStore.setInflationRate(newValue / 100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <SlidersHorizontal size={16} className="text-violet-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-[10px] text-zinc-500">Variable input</div>
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Value</label>
          <span className="text-[10px] text-zinc-400 tabular-nums">
            {value.toFixed(1)}{suffix}
          </span>
        </div>
        <input
          type="range"
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full accent-violet-400"
        />
        <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5">
          <span>{min}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>

      {/* Number input */}
      <NumberInput
        label="Exact Value"
        value={value}
        onChange={handleChange}
        suffix={suffix}
        step={step}
        min={min}
        max={max}
      />

      {/* Description */}
      {description && (
        <div className="text-[10px] text-zinc-600 leading-relaxed">{description}</div>
      )}
    </div>
  );
});
