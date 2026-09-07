/**
 * Presentation layer: turns numeric results into the words on screen.
 *
 * Kept out of the components so the wording rules — particularly the
 * end-of-contract rules in spec §4.6, which must not overstate a payable fee —
 * can be unit-tested directly (UT-065..068).
 */

import { DEFAULT_PACE_TOLERANCE_MILES } from './calculations';
import { formatMilesWithUnit, formatMonths } from './format';
import type { CalculationResult, EndAction, MileageStatus } from './types';

export type StatusTone = 'positive' | 'neutral' | 'warning' | 'negative';

export interface StatusPresentation {
  status: MileageStatus;
  tone: StatusTone;
  /** Short text label — status is never communicated by colour alone. */
  label: string;
  /** The dashboard's single hero figure. */
  heroValue: string;
  /** Reads directly after the hero figure, completing the sentence. */
  heroCaption: string;
  /** Full sentence, used for screen-reader announcements and the share text. */
  headline: string;
  detail: string;
}

export function describeStatus(result: CalculationResult): StatusPresentation {
  const variance = Math.abs(result.paceVarianceMiles);
  const allowance = formatMilesWithUnit(result.totalAllowanceMiles);

  switch (result.status) {
    case 'EXCEEDED_TOTAL': {
      const over = formatMilesWithUnit(Math.abs(result.remainingAllowanceMiles));
      return {
        status: result.status,
        tone: 'negative',
        label: 'Allowance exceeded',
        heroValue: over,
        heroCaption: 'over your total contract allowance',
        headline: `You've already exceeded your total contract allowance by ${over}`,
        detail:
          'Driving less from now can limit additional excess mileage, but it cannot remove mileage you have already driven.',
      };
    }
    case 'OVER':
      return {
        status: result.status,
        tone: 'warning',
        label: 'Over pace',
        heroValue: formatMilesWithUnit(variance),
        heroCaption: 'ahead of your allowance pace',
        headline: `You're ${formatMilesWithUnit(variance)} ahead of your mileage allowance pace`,
        detail: `To finish within ${allowance}, you'll need to drive less than your recent average for the rest of the agreement.`,
      };
    case 'UNDER':
      return {
        status: result.status,
        tone: 'positive',
        label: 'Under pace',
        heroValue: formatMilesWithUnit(variance),
        heroCaption: 'under your allowance pace',
        headline: `You're ${formatMilesWithUnit(variance)} under your expected mileage pace`,
        detail: `At your current driving rate you're projected to finish within your ${allowance} allowance.`,
      };
    case 'ON_TRACK':
    default:
      return {
        status: 'ON_TRACK',
        tone: 'positive',
        heroValue: 'On track',
        heroCaption: `within ${formatMilesWithUnit(DEFAULT_PACE_TOLERANCE_MILES)} of your allowance pace`,
        label: 'On track',
        headline: "You're on track",
        detail: `Your mileage is within ${formatMilesWithUnit(DEFAULT_PACE_TOLERANCE_MILES)} of the straight-line allowance pace for ${allowance}.`,
      };
  }
}

/** How prominently the projected charge should be presented (spec §4.6). */
export type ChargeEmphasis = 'prominent' | 'comparison' | 'deemphasised';

export interface EndActionPresentation {
  endAction: EndAction;
  emphasis: ChargeEmphasis;
  /** Label above the money figure — never the word "invoice". */
  chargeLabel: string;
  note: string;
}

export function describeEndAction(endAction: EndAction): EndActionPresentation {
  switch (endAction) {
    case 'buy':
      return {
        endAction,
        emphasis: 'deemphasised',
        chargeLabel: 'Return-equivalent estimate',
        note: 'If you buy the vehicle at the end of the agreement, excess mileage may not be charged in the same way as returning it. Check your agreement before making a decision.',
      };
    case 'part_exchange':
      return {
        endAction,
        emphasis: 'comparison',
        chargeLabel: 'Return-equivalent estimate',
        note: "Your projected mileage may affect the vehicle's part-exchange value. The figure above is useful as a return-cost comparison rather than a guaranteed invoice.",
      };
    case 'unsure':
      return {
        endAction,
        emphasis: 'prominent',
        chargeLabel: 'Estimated excess charge',
        note: 'This is the estimate that would usually apply if you returned the vehicle. It is a planning estimate — your options at the end of the agreement may change what you actually pay.',
      };
    case 'return':
    default:
      return {
        endAction: 'return',
        emphasis: 'prominent',
        chargeLabel: 'Estimated excess charge',
        note: 'Excess mileage is normally charged when a vehicle is returned. Your agreement sets the rate and how it is applied.',
      };
  }
}

/** Copy for the safe-mileage card, including the already-exceeded state. */
export function describeSafeMileage(result: CalculationResult): {
  exceeded: boolean;
  supporting: string;
} {
  if (result.remainingAllowanceMiles <= 0) {
    return {
      exceeded: true,
      supporting:
        "You've already exceeded your contracted mileage allowance. Driving less from now can limit additional excess mileage, but cannot remove mileage already driven.",
    };
  }
  if (result.progress.remainingMonths <= 0) {
    return {
      exceeded: false,
      supporting: `Your agreement term has finished with ${formatMilesWithUnit(result.remainingAllowanceMiles)} of allowance unused.`,
    };
  }
  return {
    exceeded: false,
    supporting: `Spread across the ${formatMonths(result.progress.remainingMonths)} left on your agreement.`,
  };
}
