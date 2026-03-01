import { observer } from 'mobx-react-lite';
import { Cog, TrendingUp, PiggyBank, ShieldAlert, Lightbulb, Clock, ArrowDown, Zap } from 'lucide-react';
import { useGoalStore, useAccountStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';

function InsightRow({ icon, color, headline, detail }: {
  icon: React.ReactNode;
  color: string;
  headline: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div>
        <div className={`text-xs font-medium ${color}`}>{headline}</div>
        <div className="text-[10px] text-zinc-500">{detail}</div>
      </div>
    </div>
  );
}

export const EngineEditor = observer(function EngineEditor() {
  const goalStore = useGoalStore();
  const accountStore = useAccountStore();

  const projections = goalStore.yearByYearProjection;
  const lastProjection = projections.length > 0 ? projections[projections.length - 1] : null;
  const progress = goalStore.progress;
  const statusBorderColor = progress.status === 'behind'
    ? 'border-l-red-500/70' : progress.status === 'on_track'
    ? 'border-l-amber-500/70' : 'border-l-emerald-500/70';
  const statusBgColor = progress.status === 'behind'
    ? 'bg-red-500/5' : progress.status === 'on_track'
    ? 'bg-amber-500/5' : 'bg-emerald-500/5';
  const statusTextColor = progress.status === 'behind'
    ? 'text-red-400' : progress.status === 'on_track'
    ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Cog size={16} className="text-cyan-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Retirement Plan Engine</div>
          <div className="text-[10px] text-zinc-500">
            Aggregates accounts & projects growth
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Key Statistics</div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Current Age</span>
          <span className="text-white tabular-nums">{goalStore.goal.currentAge}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Target Retirement Age</span>
          <span className="text-white tabular-nums">{goalStore.goal.targetAge}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-cyan-400 font-medium">Years Until Retirement</span>
          <span className="text-cyan-400 font-semibold tabular-nums">{goalStore.yearsToRetirement}</span>
        </div>

        <div className="h-px bg-zinc-800 my-1" />

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Current Net Worth</span>
          <span className="text-white tabular-nums">{formatCurrency(goalStore.currentNetWorth)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Monthly Contributions</span>
          <span className="text-cyan-400 tabular-nums">{formatCurrency(goalStore.monthlySavings)}/mo</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Savings Rate</span>
          <span className="text-cyan-400/70 tabular-nums">{(goalStore.computedSavingsRate * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Accounts</span>
          <span className="text-white tabular-nums">{accountStore.accounts.length}</span>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className={`border-l-2 ${statusBorderColor} ${statusBgColor} rounded-lg p-3 space-y-2.5`}>
        <div className="flex items-center gap-1.5">
          <Lightbulb size={12} className={statusTextColor} />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Actionable Insights</div>
        </div>

        <div className={`text-sm font-semibold ${statusTextColor}`}>
          {progress.status === 'behind' && `Short by ${formatCurrency(Math.abs(goalStore.monthlyIncomeGap))}/mo`}
          {progress.status === 'on_track' && `On Track — ${formatCurrency(goalStore.monthlyIncomeGap)}/mo margin`}
          {progress.status === 'ahead' && `Ahead by ${formatCurrency(goalStore.monthlyIncomeGap)}/mo`}
        </div>

        {progress.status === 'behind' && (
          <div className="space-y-2">
            {goalStore.additionalMonthlySavingsNeeded > 0 && (
              <InsightRow
                icon={<PiggyBank size={12} />}
                color="text-cyan-400"
                headline={`Save ${formatCurrency(goalStore.additionalMonthlySavingsNeeded)} more/mo`}
                detail="Closes the gap with your current investment mix"
              />
            )}
            {goalStore.yearsToDelayForTarget > 0 && (
              <InsightRow
                icon={<Clock size={12} />}
                color="text-amber-400"
                headline={`Work ${goalStore.yearsToDelayForTarget} more year${goalStore.yearsToDelayForTarget !== 1 ? 's' : ''}`}
                detail={`Retire at ${goalStore.goal.targetAge + goalStore.yearsToDelayForTarget} instead of ${goalStore.goal.targetAge}`}
              />
            )}
            {goalStore.yearsToDelayForTarget === -1 && (
              <InsightRow
                icon={<Clock size={12} />}
                color="text-red-400"
                headline="Delay alone won't close the gap"
                detail="Combine saving more with adjusting your spending goal"
              />
            )}
            <InsightRow
              icon={<ArrowDown size={12} />}
              color="text-violet-400"
              headline={`Reduce spending to ${formatCurrency(Math.max(0, goalStore.realNetRetirementIncome))}/mo`}
              detail="What your current plan supports in retirement"
            />
          </div>
        )}

        {progress.status !== 'behind' && (
          <div className="space-y-2">
            {goalStore.yearsCanRetireEarly > 0 && (
              <InsightRow
                icon={<Zap size={12} />}
                color="text-cyan-400"
                headline={`Retire ${goalStore.yearsCanRetireEarly} year${goalStore.yearsCanRetireEarly !== 1 ? 's' : ''} early`}
                detail={`Could retire at ${goalStore.goal.targetAge - goalStore.yearsCanRetireEarly} instead of ${goalStore.goal.targetAge}`}
              />
            )}
            {goalStore.monthlyIncomeGap > 0 && (
              <InsightRow
                icon={<TrendingUp size={12} />}
                color="text-emerald-400"
                headline={`Can afford ${formatCurrency(goalStore.realNetRetirementIncome)}/mo`}
                detail={`${formatCurrency(goalStore.monthlyIncomeGap)}/mo more than your ${formatCurrency(goalStore.goal.monthlySpending)}/mo goal`}
              />
            )}
          </div>
        )}

        {goalStore.savingsImpactPer100 > 0 && (
          <div className="text-[9px] text-zinc-500 leading-relaxed pt-1 border-t border-zinc-800/50">
            Every extra <span className="text-cyan-400/80">$100/mo</span> saved grows
            to <span className="text-cyan-400/80">{formatCurrency(goalStore.savingsImpactPer100, true)}</span> by retirement.
          </div>
        )}
      </div>

      {/* Projected Values */}
      {lastProjection && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            At Retirement (Age {goalStore.goal.targetAge})
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-cyan-400" />
              <span className="text-zinc-400">Ending Net Worth</span>
            </span>
            <span className="text-cyan-400 font-semibold tabular-nums">
              {formatCurrency(goalStore.endingNetWorth, true)}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-violet-400" />
              <span className="text-zinc-400">Real Value (today's $)</span>
            </span>
            <span className="text-violet-400 tabular-nums">
              {formatCurrency(goalStore.endingNetWorthReal, true)}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Required Savings</span>
            <span className="text-zinc-300 tabular-nums">{formatCurrency(goalStore.requiredSavings, true)}</span>
          </div>
        </div>
      )}

      {/* Contribution vs Growth Split */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <PiggyBank size={12} className="text-zinc-500" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Contributions vs Growth</div>
        </div>

        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-zinc-800">
          {goalStore.endingNetWorth > 0 && (
            <>
              {/* Current balances portion */}
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(goalStore.currentNetWorth / goalStore.endingNetWorth) * 100}%`,
                  backgroundColor: '#3b82f6',
                }}
                title={`Current Balances: ${formatCurrency(goalStore.currentNetWorth)}`}
              />
              {/* New contributions portion */}
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(goalStore.totalContributionsAtRetirement / goalStore.endingNetWorth) * 100}%`,
                  backgroundColor: '#22d3ee',
                }}
                title={`New Contributions: ${formatCurrency(goalStore.totalContributionsAtRetirement)}`}
              />
              {/* Growth portion */}
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${goalStore.growthPercent}%`,
                  backgroundColor: '#22c55e',
                }}
                title={`Investment Growth: ${formatCurrency(goalStore.totalGrowthAtRetirement)}`}
              />
            </>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">Current Balances</span>
            </span>
            <span className="text-blue-400 tabular-nums">{formatCurrency(goalStore.currentNetWorth, true)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-zinc-400">New Contributions</span>
            </span>
            <span className="text-cyan-400 tabular-nums">{formatCurrency(goalStore.totalContributionsAtRetirement, true)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Investment Growth</span>
            </span>
            <span className="text-emerald-400 tabular-nums">{formatCurrency(goalStore.totalGrowthAtRetirement, true)}</span>
          </div>

          <div className="h-px bg-zinc-800 my-0.5" />

          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Principal (balances + contributions)</span>
            <span className="text-zinc-400 tabular-nums">{goalStore.contributionSharePercent.toFixed(0)}%</span>
          </div>

          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Growth (compound interest)</span>
            <span className="text-emerald-400/70 tabular-nums">{goalStore.growthPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Tax Basis Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={12} className="text-amber-400" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Tax Basis (Conservative)</div>
        </div>

        {/* Tax bar */}
        <div className="h-2.5 rounded-full overflow-hidden flex bg-zinc-800">
          {goalStore.endingNetWorth > 0 && (
            <>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${goalStore.taxablePercent}%`,
                  backgroundColor: '#ef4444',
                }}
                title={`Taxable: ${formatCurrency(goalStore.taxableGains)}`}
              />
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${100 - goalStore.taxablePercent}%`,
                  backgroundColor: '#22c55e',
                }}
                title={`Cost Basis: ${formatCurrency(goalStore.costBasis)}`}
              />
            </>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-zinc-400">Taxable Gains</span>
            </span>
            <span className="text-red-400 tabular-nums">{formatCurrency(goalStore.taxableGains, true)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Cost Basis (deductible)</span>
            </span>
            <span className="text-emerald-400 tabular-nums">{formatCurrency(goalStore.costBasis, true)}</span>
          </div>

          <div className="h-px bg-zinc-800 my-0.5" />

          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Taxable %</span>
            <span className="text-red-400/70 tabular-nums">{goalStore.taxablePercent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-[9px] text-zinc-600 leading-relaxed mt-1">
          Conservative: current balances assumed 100% taxable gains (no cost basis).
          Only future contributions create deductible cost basis.
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-zinc-500 leading-relaxed">
        The engine aggregates all connected accounts, applies the auto-derived monthly savings
        ({formatCurrency(goalStore.monthlySavings)}/mo from income minus taxes minus expenses),
        and projects compound growth to retirement.
        The <span className="text-cyan-400">cyan line</span> is nominal and
        the <span className="text-violet-400">violet line</span> is inflation-adjusted
        ({(goalStore.inflationRate * 100).toFixed(0)}% rate).
      </div>
    </div>
  );
});
