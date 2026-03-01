import type { FilingStatus } from '../core/types/tax';
export type { FilingStatus };
export { FILING_STATUS_LABELS } from '../core/types/tax';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// ────────────────────────────────────────────────────────────
// 2024 Federal Ordinary Income Tax Brackets
// ────────────────────────────────────────────────────────────

const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// ────────────────────────────────────────────────────────────
// 2024 Long-Term Capital Gains / Qualified Dividends Brackets
// These are based on *taxable income* (ordinary + LTCG combined),
// but LTCG income is taxed at these preferential rates.
// ────────────────────────────────────────────────────────────

const LTCG_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 47025, rate: 0.00 },
    { min: 47025, max: 518900, rate: 0.15 },
    { min: 518900, max: Infinity, rate: 0.20 },
  ],
  married_joint: [
    { min: 0, max: 94050, rate: 0.00 },
    { min: 94050, max: 583750, rate: 0.15 },
    { min: 583750, max: Infinity, rate: 0.20 },
  ],
  married_separate: [
    { min: 0, max: 47025, rate: 0.00 },
    { min: 47025, max: 291850, rate: 0.15 },
    { min: 291850, max: Infinity, rate: 0.20 },
  ],
  head_of_household: [
    { min: 0, max: 63000, rate: 0.00 },
    { min: 63000, max: 551350, rate: 0.15 },
    { min: 551350, max: Infinity, rate: 0.20 },
  ],
};

// ────────────────────────────────────────────────────────────
// Net Investment Income Tax (NIIT) — 3.8% surtax
// ────────────────────────────────────────────────────────────

const NIIT_RATE = 0.038;
const NIIT_THRESHOLD: Record<FilingStatus, number> = {
  single: 200000,
  married_joint: 250000,
  married_separate: 125000,
  head_of_household: 200000,
};

// ────────────────────────────────────────────────────────────
// Standard Deductions & FICA
// ────────────────────────────────────────────────────────────

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 14600,
  married_joint: 29200,
  married_separate: 14600,
  head_of_household: 21900,
};

const SS_WAGE_BASE = 168600;
const SS_TAX_RATE = 0.062;
const MEDICARE_TAX_RATE = 0.0145;
const MEDICARE_SURTAX_THRESHOLD_SINGLE = 200000;
const MEDICARE_SURTAX_THRESHOLD_JOINT = 250000;
const MEDICARE_SURTAX_RATE = 0.009;

// ────────────────────────────────────────────────────────────
// Income Allocation (retirement income by tax treatment)
// ────────────────────────────────────────────────────────────

export interface IncomeAllocation {
  /** 401(k), Traditional IRA, Pension, SS — taxed at ordinary rates */
  ordinary: number;
  /** Brokerage LTCG / qualified dividends — preferential rates */
  ltcg: number;
  /** Roth withdrawals — tax-free */
  taxFree: number;
}

// ────────────────────────────────────────────────────────────
// Tax Calculation Functions
// ────────────────────────────────────────────────────────────

/**
 * Progressive bracket calculation helper.
 */
function calcProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

/**
 * Calculate federal tax on ordinary income only.
 */
export function calcFederalOrdinaryTax(ordinaryIncome: number, filingStatus: FilingStatus): number {
  const deduction = STANDARD_DEDUCTION[filingStatus];
  const taxable = Math.max(0, ordinaryIncome - deduction);
  return calcProgressiveTax(taxable, FEDERAL_BRACKETS[filingStatus]);
}

/**
 * Calculate federal tax on long-term capital gains / qualified dividends.
 *
 * LTCG is "stacked on top" of ordinary taxable income when determining
 * which LTCG bracket applies, but is taxed at its own preferential rates.
 */
export function calcFederalLTCGTax(
  ltcgIncome: number,
  ordinaryIncome: number,
  filingStatus: FilingStatus,
): number {
  if (ltcgIncome <= 0) return 0;

  const deduction = STANDARD_DEDUCTION[filingStatus];
  const ordinaryTaxable = Math.max(0, ordinaryIncome - deduction);
  const brackets = LTCG_BRACKETS[filingStatus];

  // LTCG starts where ordinary income ends in the bracket stack
  let tax = 0;
  let ltcgRemaining = ltcgIncome;

  for (const bracket of brackets) {
    if (ltcgRemaining <= 0) break;

    // How much room is left in this bracket after ordinary income fills it
    const bracketSize = bracket.max - bracket.min;
    const ordinaryInBracket = Math.max(0, Math.min(ordinaryTaxable, bracket.max) - bracket.min);
    const roomForLTCG = bracketSize - ordinaryInBracket;

    if (roomForLTCG <= 0) continue;

    const ltcgInBracket = Math.min(ltcgRemaining, roomForLTCG);
    tax += ltcgInBracket * bracket.rate;
    ltcgRemaining -= ltcgInBracket;
  }

  return tax;
}

/**
 * Calculate Net Investment Income Tax (NIIT) — 3.8% surtax on
 * investment income above the threshold.
 */
export function calcNIIT(
  investmentIncome: number,
  totalAGI: number,
  filingStatus: FilingStatus,
): number {
  const threshold = NIIT_THRESHOLD[filingStatus];
  if (totalAGI <= threshold) return 0;
  const excessAGI = totalAGI - threshold;
  const taxableInvestment = Math.min(investmentIncome, excessAGI);
  return taxableInvestment * NIIT_RATE;
}

/**
 * Calculate state income tax (simplified flat rate, applies to all taxable income).
 */
export function calcStateTax(taxableIncome: number, stateRate: number): number {
  return Math.max(0, taxableIncome * stateRate);
}

/**
 * Calculate FICA taxes (Social Security + Medicare).
 * In retirement, most income is not subject to FICA.
 */
export function calcFICATax(
  annualIncome: number,
  filingStatus: FilingStatus = 'single',
  isRetirementIncome: boolean = true,
): number {
  if (isRetirementIncome) return 0;

  const ssTax = Math.min(annualIncome, SS_WAGE_BASE) * SS_TAX_RATE;
  const medicareTax = annualIncome * MEDICARE_TAX_RATE;

  const surtaxThreshold =
    filingStatus === 'married_joint'
      ? MEDICARE_SURTAX_THRESHOLD_JOINT
      : MEDICARE_SURTAX_THRESHOLD_SINGLE;

  const medicareSurtax =
    annualIncome > surtaxThreshold
      ? (annualIncome - surtaxThreshold) * MEDICARE_SURTAX_RATE
      : 0;

  return ssTax + medicareTax + medicareSurtax;
}

// ────────────────────────────────────────────────────────────
// Full Tax Breakdown
// ────────────────────────────────────────────────────────────

export interface TaxBreakdown {
  grossAnnual: number;
  allocation: IncomeAllocation;
  /** Federal tax on ordinary income (401k, pension, SS, etc.) */
  federalOrdinary: number;
  /** Federal tax on LTCG / qualified dividends */
  federalLTCG: number;
  /** Net Investment Income Tax (3.8% surtax) */
  niit: number;
  /** Total federal tax */
  federal: number;
  state: number;
  fica: number;
  totalTax: number;
  effectiveRate: number;
  /** Effective rate on just the taxable portion (excludes tax-free) */
  effectiveTaxableRate: number;
  netAnnual: number;
  netMonthly: number;
}

/**
 * Calculate complete tax breakdown for retirement income,
 * properly handling ordinary vs LTCG vs tax-free income.
 */
export function calcRetirementTax(
  grossAnnual: number,
  filingStatus: FilingStatus,
  stateRate: number,
  allocation: IncomeAllocation,
): TaxBreakdown {
  // Compute actual dollar amounts for each category
  const totalPct = allocation.ordinary + allocation.ltcg + allocation.taxFree;
  const normOrd = totalPct > 0 ? allocation.ordinary / totalPct : 1;
  const normLTCG = totalPct > 0 ? allocation.ltcg / totalPct : 0;
  const normFree = totalPct > 0 ? allocation.taxFree / totalPct : 0;

  const ordinaryIncome = grossAnnual * normOrd;
  const ltcgIncome = grossAnnual * normLTCG;
  const taxFreeIncome = grossAnnual * normFree;

  // Federal taxes
  const federalOrdinary = calcFederalOrdinaryTax(ordinaryIncome, filingStatus);
  const federalLTCG = calcFederalLTCGTax(ltcgIncome, ordinaryIncome, filingStatus);
  const niit = calcNIIT(ltcgIncome, ordinaryIncome + ltcgIncome, filingStatus);
  const federal = federalOrdinary + federalLTCG + niit;

  // State tax (typically applies to ordinary + LTCG, not Roth)
  const state = calcStateTax(ordinaryIncome + ltcgIncome, stateRate);

  // FICA (not applicable to retirement income)
  const fica = 0;

  const totalTax = federal + state + fica;
  const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0;
  const taxableGross = ordinaryIncome + ltcgIncome;
  const effectiveTaxableRate = taxableGross > 0 ? totalTax / taxableGross : 0;
  const netAnnual = grossAnnual - totalTax;
  const netMonthly = netAnnual / 12;

  return {
    grossAnnual,
    allocation: {
      ordinary: ordinaryIncome,
      ltcg: ltcgIncome,
      taxFree: taxFreeIncome,
    },
    federalOrdinary,
    federalLTCG,
    niit,
    federal,
    state,
    fica,
    totalTax,
    effectiveRate,
    effectiveTaxableRate,
    netAnnual,
    netMonthly,
  };
}

/**
 * Legacy wrapper — treats all income as ordinary.
 * Kept for backwards compatibility.
 */
export function calcNetIncome(
  grossAnnual: number,
  filingStatus: FilingStatus,
  stateRate: number,
  _isRetirementIncome: boolean = true,
): TaxBreakdown {
  return calcRetirementTax(grossAnnual, filingStatus, stateRate, {
    ordinary: 100,
    ltcg: 0,
    taxFree: 0,
  });
}

// ────────────────────────────────────────────────────────────
// W2 (Working Years) Tax Breakdown
// ────────────────────────────────────────────────────────────

export interface W2TaxBreakdown {
  grossAnnual: number;
  federalIncome: number;
  state: number;
  socialSecurity: number;
  medicare: number;
  medicareSurtax: number;
  totalFICA: number;
  totalTax: number;
  effectiveRate: number;
  netAnnual: number;
  netMonthly: number;
}

/**
 * Calculate complete W2 tax breakdown for working-years employment income.
 * Includes federal income tax, state tax, and FICA (SS + Medicare).
 */
export function calcW2Tax(
  grossAnnual: number,
  filingStatus: FilingStatus,
  stateRate: number,
): W2TaxBreakdown {
  if (grossAnnual <= 0) {
    return {
      grossAnnual: 0,
      federalIncome: 0,
      state: 0,
      socialSecurity: 0,
      medicare: 0,
      medicareSurtax: 0,
      totalFICA: 0,
      totalTax: 0,
      effectiveRate: 0,
      netAnnual: 0,
      netMonthly: 0,
    };
  }

  // Federal income tax (ordinary brackets with standard deduction)
  const federalIncome = calcFederalOrdinaryTax(grossAnnual, filingStatus);

  // State income tax
  const deduction = STANDARD_DEDUCTION[filingStatus];
  const stateTaxable = Math.max(0, grossAnnual - deduction);
  const state = calcStateTax(stateTaxable, stateRate);

  // FICA: Social Security
  const socialSecurity = Math.min(grossAnnual, SS_WAGE_BASE) * SS_TAX_RATE;

  // FICA: Medicare
  const medicare = grossAnnual * MEDICARE_TAX_RATE;

  // Medicare surtax (Additional Medicare Tax)
  const surtaxThreshold =
    filingStatus === 'married_joint'
      ? MEDICARE_SURTAX_THRESHOLD_JOINT
      : MEDICARE_SURTAX_THRESHOLD_SINGLE;
  const medicareSurtax =
    grossAnnual > surtaxThreshold
      ? (grossAnnual - surtaxThreshold) * MEDICARE_SURTAX_RATE
      : 0;

  const totalFICA = socialSecurity + medicare + medicareSurtax;
  const totalTax = federalIncome + state + totalFICA;
  const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0;
  const netAnnual = grossAnnual - totalTax;
  const netMonthly = netAnnual / 12;

  return {
    grossAnnual,
    federalIncome,
    state,
    socialSecurity,
    medicare,
    medicareSurtax,
    totalFICA,
    totalTax,
    effectiveRate,
    netAnnual,
    netMonthly,
  };
}

