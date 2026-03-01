import { observer } from 'mobx-react-lite';
import { Calculator, Info } from 'lucide-react';
import { useTaxStore } from '../../stores/RootStore';
import { formatCurrency } from '../../services/financialCalc';
import { FILING_STATUS_LABELS, type FilingStatus } from '../../core/types/tax';

const FILING_STATUSES: FilingStatus[] = ['single', 'married_joint', 'married_separate', 'head_of_household'];

export const TaxEditor = observer(function TaxEditor() {
  const taxStore = useTaxStore();
  const breakdown = taxStore.breakdown;
  const alloc = taxStore.allocation;
  const totalAlloc = alloc.ordinary + alloc.ltcg + alloc.taxFree;

  const ordPct = totalAlloc > 0 ? (alloc.ordinary / totalAlloc) * 100 : 100;
  const ltcgPct = totalAlloc > 0 ? (alloc.ltcg / totalAlloc) * 100 : 0;
  const freePct = totalAlloc > 0 ? (alloc.taxFree / totalAlloc) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Calculator size={16} className="text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Tax Calculator</div>
          <div className="text-[10px] text-zinc-500">Federal + State + LTCG</div>
        </div>
      </div>

      {/* Filing Status */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Filing Status
        </label>
        <select
          value={taxStore.filingStatus}
          onChange={(e) => taxStore.setFilingStatus(e.target.value as FilingStatus)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
        >
          {FILING_STATUSES.map((s) => (
            <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* State Tax Rate */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
            State Tax Rate
          </label>
          <span className="text-[10px] text-zinc-400 tabular-nums">
            {(taxStore.stateRate * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          value={taxStore.stateRate * 100}
          onChange={(e) => taxStore.setStateRate(Number(e.target.value) / 100)}
          min={0}
          max={13}
          step={0.1}
          className="w-full accent-amber-400"
        />
      </div>

      {/* Income Allocation */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Income Allocation</div>
          <button
            onClick={() => taxStore.setAutoAllocate(!taxStore.autoAllocate)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              taxStore.autoAllocate
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {taxStore.autoAllocate ? 'Auto' : 'Manual'}
          </button>
        </div>

        {/* Visual breakdown bar */}
        <div className="h-2 rounded-full overflow-hidden flex bg-zinc-800">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${ordPct}%` }} />
          <div className="h-full bg-violet-500 transition-all" style={{ width: `${ltcgPct}%` }} />
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${freePct}%` }} />
        </div>

        {/* Category labels */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-zinc-400">Ordinary</span>
            </span>
            <span className="text-amber-400 tabular-nums">{ordPct.toFixed(0)}%</span>
          </div>
          <div className="text-[9px] text-zinc-600 ml-3.5">401(k), Trad IRA, Pension, SS</div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-zinc-400">LT Capital Gains</span>
            </span>
            <span className="text-violet-400 tabular-nums">{ltcgPct.toFixed(0)}%</span>
          </div>
          <div className="text-[9px] text-zinc-600 ml-3.5">Brokerage (0% / 15% / 20%)</div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Tax-Free</span>
            </span>
            <span className="text-emerald-400 tabular-nums">{freePct.toFixed(0)}%</span>
          </div>
          <div className="text-[9px] text-zinc-600 ml-3.5">Roth IRA (qualified withdrawals)</div>
        </div>

        {/* Manual sliders (when not auto) */}
        {!taxStore.autoAllocate && (
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-zinc-500">Ordinary %</span>
                <span className="text-zinc-400 tabular-nums">{taxStore.manualOrdinaryPct}%</span>
              </div>
              <input
                type="range"
                value={taxStore.manualOrdinaryPct}
                onChange={(e) => taxStore.setManualOrdinaryPct(Number(e.target.value))}
                min={0} max={100} step={1}
                className="w-full accent-amber-400 h-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-zinc-500">LTCG %</span>
                <span className="text-zinc-400 tabular-nums">{taxStore.manualLtcgPct}%</span>
              </div>
              <input
                type="range"
                value={taxStore.manualLtcgPct}
                onChange={(e) => taxStore.setManualLtcgPct(Number(e.target.value))}
                min={0} max={100} step={1}
                className="w-full accent-violet-400 h-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-zinc-500">Tax-Free %</span>
                <span className="text-zinc-400 tabular-nums">{taxStore.manualTaxFreePct}%</span>
              </div>
              <input
                type="range"
                value={taxStore.manualTaxFreePct}
                onChange={(e) => taxStore.setManualTaxFreePct(Number(e.target.value))}
                min={0} max={100} step={1}
                className="w-full accent-emerald-400 h-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tax Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Tax Breakdown (Annual)</div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-400">Gross Income</span>
          </span>
          <span className="text-white tabular-nums">{formatCurrency(breakdown.grossAnnual)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-400">Federal (Ordinary)</span>
          </span>
          <span className="text-red-400 tabular-nums">-{formatCurrency(breakdown.federalOrdinary)}</span>
        </div>

        {breakdown.federalLTCG > 0 && (
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-zinc-400">Federal (LTCG)</span>
            </span>
            <span className="text-violet-400 tabular-nums">-{formatCurrency(breakdown.federalLTCG)}</span>
          </div>
        )}

        {breakdown.niit > 0 && (
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-zinc-400">NIIT (3.8%)</span>
            </span>
            <span className="text-pink-400 tabular-nums">-{formatCurrency(breakdown.niit)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-400">State Tax</span>
          </span>
          <span className="text-amber-400 tabular-nums">-{formatCurrency(breakdown.state)}</span>
        </div>

        <div className="h-px bg-zinc-700 my-1" />

        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-300 font-medium">Net Income</span>
          </span>
          <span className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(breakdown.netAnnual)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Monthly</span>
          <span className="text-emerald-400 tabular-nums">{formatCurrency(breakdown.netMonthly)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Overall Effective Rate</span>
          <span className="text-zinc-300 tabular-nums">{(breakdown.effectiveRate * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Taxable Effective Rate</span>
          <span className="text-zinc-300 tabular-nums">{(breakdown.effectiveTaxableRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-1.5 text-[10px] text-zinc-600 leading-relaxed">
        <Info size={12} className="shrink-0 mt-0.5 text-zinc-600" />
        <span>
          LTCG &amp; qualified dividends taxed at 0%/15%/20% brackets,
          stacked above ordinary income. Roth withdrawals are federally tax-free.
          NIIT applies at 3.8% on investment income above thresholds.
        </span>
      </div>
    </div>
  );
});
