/**
 * Carbon footprint calculator — pure functions, fully testable.
 * Based on IPCC emission factors for passenger transport.
 */

export type TransportMode =
  | "car"
  | "bus"
  | "train"
  | "metro"
  | "bicycle"
  | "walking"
  | "taxi"
  | "rideshare"
  | "airplane";

export type CarbonTier = "zero" | "low" | "medium" | "high" | "very-high";

/** kg CO₂ per passenger-km */
const EMISSION_FACTORS: Record<TransportMode, number> = {
  walking: 0,
  bicycle: 0,
  metro: 0.041,
  train: 0.041,
  bus: 0.089,
  rideshare: 0.096, // shared ride (2 passengers avg)
  taxi: 0.192,
  car: 0.192, // avg petrol car, single occupant
  airplane: 0.255, // short-haul
};

/** Baseline: single-occupant petrol car */
const BASELINE_EMISSION_FACTOR = EMISSION_FACTORS.car;

/**
 * Calculate kg CO₂ emitted for a trip.
 */
export function calculateTransportEmissions(
  mode: TransportMode,
  distanceKm: number
): number {
  if (distanceKm < 0) throw new RangeError("Distance must be non-negative");
  return EMISSION_FACTORS[mode] * distanceKm;
}

/**
 * Calculate kg CO₂ saved vs baseline (single car).
 */
export function calculateSavedEmissions(
  mode: TransportMode,
  distanceKm: number
): number {
  const actual = calculateTransportEmissions(mode, distanceKm);
  const baseline = BASELINE_EMISSION_FACTOR * distanceKm;
  return Math.max(0, baseline - actual);
}

/**
 * Return a sustainability tier label for a given emission amount (kg CO₂).
 */
export function getCarbonTier(kgCo2: number): CarbonTier {
  if (kgCo2 === 0) return "zero";
  if (kgCo2 < 2) return "low";
  if (kgCo2 < 10) return "medium";
  if (kgCo2 < 30) return "high";
  return "very-high";
}

/**
 * Human-readable label for a carbon tier.
 */
export function getCarbonTierLabel(tier: CarbonTier): string {
  const labels: Record<CarbonTier, string> = {
    zero: "Zero emissions",
    low: "Low emissions",
    medium: "Moderate emissions",
    high: "High emissions",
    "very-high": "Very high emissions",
  };
  return labels[tier];
}

/**
 * Suggest greener alternatives for a given transport mode.
 */
export function suggestGreenerAlternatives(mode: TransportMode): TransportMode[] {
  const allModes: TransportMode[] = [
    "walking",
    "bicycle",
    "metro",
    "train",
    "bus",
    "rideshare",
    "taxi",
    "car",
    "airplane",
  ];
  const currentFactor = EMISSION_FACTORS[mode];

  return allModes.filter(
    (m) => EMISSION_FACTORS[m] < currentFactor && m !== mode
  );
}

/**
 * Calculate total carbon saved across many fans choosing greener transport.
 */
export function calculateCollectiveSavings(
  fanCounts: Partial<Record<TransportMode, number>>,
  averageDistanceKm: number
): number {
  return Object.entries(fanCounts).reduce((total, [mode, count]) => {
    const saved = calculateSavedEmissions(mode as TransportMode, averageDistanceKm);
    return total + saved * (count ?? 0);
  }, 0);
}
