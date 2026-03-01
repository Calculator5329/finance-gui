interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  value,
  color = '#22d3ee',
  height = 4,
  className = '',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full rounded-full overflow-hidden bg-zinc-800 ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clampedValue}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />
    </div>
  );
}
