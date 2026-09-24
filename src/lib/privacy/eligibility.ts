const ADULT_AGE = 18;

export function ageOnDate(birthDate: Date, onDate: Date): number {
  let age = onDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = onDate.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && onDate.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: "under_18" };

/** MVP is U.S. adults 18+ only. Under 18 stops onboarding before health data collection. */
export function adultEligibility(birthDate: Date, onDate: Date): Eligibility {
  if (ageOnDate(birthDate, onDate) < ADULT_AGE) {
    return { eligible: false, reason: "under_18" };
  }
  return { eligible: true };
}
