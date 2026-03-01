import { TrendingUp } from 'lucide-react';

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
        <TrendingUp className="w-8 h-8 text-cyan-400" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold tracking-wide text-white mb-3">
        Let's Build Your Retirement Plan
      </h1>

      {/* Description */}
      <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-6">
        Answer a few quick questions about your finances and goals.
        We'll use your answers to create a personalized retirement
        projection you can explore and fine-tune.
      </p>

      {/* What we'll cover */}
      <div className="w-full max-w-xs space-y-2.5 text-left">
        {[
          { label: 'Your age & retirement timeline', step: '1' },
          { label: 'Current income & retirement needs', step: '2' },
          { label: 'Investment accounts & balances', step: '3' },
        ].map((item) => (
          <div
            key={item.step}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-800/60"
          >
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center shrink-0">
              {item.step}
            </span>
            <span className="text-zinc-300 text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="text-zinc-500 text-[11px] mt-6">
        Takes about 2 minutes — you can always change things later.
      </p>
    </div>
  );
}
