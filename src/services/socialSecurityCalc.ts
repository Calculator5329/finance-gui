/**
 * Simplified Social Security benefit estimator.
 *
 * Uses Average Indexed Monthly Earnings (AIME) and Primary Insurance Amount (PIA)
 * bend points to estimate monthly SS benefits. This is a simplified model
 * that assumes consistent income throughout working years.
 */

/** 2024 PIA bend points */
const BEND_POINT_1 = 1174;
const BEND_POINT_2 = 7078;

/** PIA formula replacement rates */
const RATE_1 = 0.90;
const RATE_2 = 0.32;
const RATE_3 = 0.15;

/** Full Retirement Age by birth year (simplified) */
const FULL_RETIREMENT_AGE = 67;

/** Early/late claim adjustment factors per month */
const EARLY_REDUCTION_PER_MONTH_FIRST_36 = 5 / 900; // ~0.556% per month
const EARLY_REDUCTION_PER_MONTH_AFTER_36 = 5 / 1200; // ~0.417% per month
const DELAYED_CREDIT_PER_MONTH = 2 / 300; // ~0.667% per month (8% per year)

/** Maximum claimable age */
const MAX_CLAIM_AGE = 70;
const MIN_CLAIM_AGE = 62;

/**
 * Estimate the Primary Insurance Amount (PIA) from current annual income.
 * Assumes 35 years of similar earnings (simplified).
 */
function estimatePIA(currentAnnualIncome: number): number {
  // AIME = Average Indexed Monthly Earnings over 35 highest years
  // Simplified: assume current income represents career average
  const aime = currentAnnualIncome / 12;

  let pia = 0;

  // First bend point
  pia += Math.min(aime, BEND_POINT_1) * RATE_1;

  // Second bend point
  if (aime > BEND_POINT_1) {
    pia += Math.min(aime - BEND_POINT_1, BEND_POINT_2 - BEND_POINT_1) * RATE_2;
  }

  // Above second bend point
  if (aime > BEND_POINT_2) {
    pia += (aime - BEND_POINT_2) * RATE_3;
  }

  return pia;
}

/**
 * Adjust PIA for early or late claiming relative to Full Retirement Age.
 */
function adjustForClaimAge(pia: number, claimAge: number): number {
  const claimAgeMonths = Math.round(claimAge * 12);
  const fraMonths = FULL_RETIREMENT_AGE * 12;
  const diffMonths = claimAgeMonths - fraMonths;

  if (diffMonths === 0) return pia;

  if (diffMonths < 0) {
    // Early claiming - reduce benefit
    const earlyMonths = Math.abs(diffMonths);
    const first36 = Math.min(earlyMonths, 36);
    const remaining = Math.max(0, earlyMonths - 36);
    const reduction =
      first36 * EARLY_REDUCTION_PER_MONTH_FIRST_36 +
      remaining * EARLY_REDUCTION_PER_MONTH_AFTER_36;
    return pia * (1 - reduction);
  }

  // Delayed claiming - increase benefit
  const delayedMonths = Math.min(diffMonths, (MAX_CLAIM_AGE - FULL_RETIREMENT_AGE) * 12);
  const increase = delayedMonths * DELAYED_CREDIT_PER_MONTH;
  return pia * (1 + increase);
}

/**
 * Estimate monthly Social Security benefit.
 *
 * @param currentAnnualIncome - Current annual income (for AIME estimation)
 * @param claimAge - Age at which benefits will be claimed (62-70)
 * @returns Estimated monthly benefit in today's dollars
 */
export function estimateSSBenefit(
  currentAnnualIncome: number,
  claimAge: number = FULL_RETIREMENT_AGE,
): number {
  const clampedAge = Math.max(MIN_CLAIM_AGE, Math.min(MAX_CLAIM_AGE, claimAge));
  const pia = estimatePIA(currentAnnualIncome);
  return adjustForClaimAge(pia, clampedAge);
}

/**
 * Adjust SS benefit for cost-of-living increases over time.
 */
export function calcSSWithCOLA(
  baseBenefit: number,
  yearsUntilClaim: number,
  colaRate: number = 0.025,
): number {
  return baseBenefit * Math.pow(1 + colaRate, yearsUntilClaim);
}

export { FULL_RETIREMENT_AGE, MIN_CLAIM_AGE, MAX_CLAIM_AGE };
