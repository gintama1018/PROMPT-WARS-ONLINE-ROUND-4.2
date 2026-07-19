/**
 * Crowd density utilities — pure functions, fully testable.
 * Used for real-time crowd management decisions.
 */

export type CrowdRiskLevel = "low" | "moderate" | "high" | "critical";

/**
 * Convert crowd density percentage (0-100) to a risk level.
 */
export function crowdDensityToRiskLevel(density: number): CrowdRiskLevel {
  if (density < 0 || density > 100) {
    throw new RangeError(`Density must be 0-100, got ${density}`);
  }
  if (density < 40) return "low";
  if (density < 70) return "moderate";
  if (density < 85) return "high";
  return "critical";
}

/**
 * Map a risk level to a CSS hex color for UI display.
 */
export function crowdRiskLevelToColor(riskLevel: CrowdRiskLevel): string {
  const colors: Record<CrowdRiskLevel, string> = {
    low: "#22c55e",      // green-500
    moderate: "#f59e0b", // amber-500
    high: "#f97316",     // orange-500
    critical: "#ef4444", // red-500
  };
  return colors[riskLevel];
}

/**
 * Map crowd density directly to a display color.
 */
export function crowdDensityToColor(density: number): string {
  return crowdRiskLevelToColor(crowdDensityToRiskLevel(density));
}

/**
 * Calculate a route score (0-100) for fan navigation.
 * Higher score = better route.
 */
export function routeScore(params: {
  distanceMeters: number;
  crowdDensity: number; // 0-100
  isAccessible: boolean;
  estimatedWaitSeconds?: number;
}): number {
  const { distanceMeters, crowdDensity, isAccessible, estimatedWaitSeconds = 0 } = params;

  // Normalize distance penalty (0 = 0m, -30 at 500m, -60 at 1000m)
  const distancePenalty = Math.min(60, distanceMeters / 500) * 30;

  // Crowd penalty: increases sharply above 70%
  const crowdPenalty = crowdDensity > 70
    ? (crowdDensity - 70) * 1.5
    : crowdDensity * 0.2;

  // Wait time penalty (0 at 0s, -10 at 5min, -20 at 10min)
  const waitPenalty = Math.min(20, estimatedWaitSeconds / 30);

  // Accessibility bonus: routes that are accessible get a small bonus
  const accessibilityBonus = isAccessible ? 10 : 0;

  const score = 100 - distancePenalty - crowdPenalty - waitPenalty + accessibilityBonus;
  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate crowd dispersal time in minutes after match end.
 */
export function estimateDispersalTime(
  totalFans: number,
  exitCapacityPerMinute: number,
  crowdDensity: number
): number {
  if (exitCapacityPerMinute <= 0) throw new RangeError("Exit capacity must be positive");
  const densityFactor = 1 + (crowdDensity / 100) * 0.5; // higher density = slower exit
  return Math.ceil((totalFans / exitCapacityPerMinute) * densityFactor);
}

/**
 * Get crowd management recommendations for a given density + context.
 */
export function getCrowdRecommendations(
  riskLevel: CrowdRiskLevel,
  zone: string
): string[] {
  const base: Record<CrowdRiskLevel, string[]> = {
    low: [
      `Zone ${zone} is operating normally`,
      "Continue standard monitoring",
      "No immediate action required",
    ],
    moderate: [
      `Monitor Zone ${zone} closely`,
      "Consider opening additional access points",
      "Alert nearby staff to stand by",
      "Update digital signage to redistribute flow",
    ],
    high: [
      `Reduce inflow to Zone ${zone} immediately`,
      "Deploy additional crowd management staff",
      "Open all available exit routes",
      "Activate public address system guidance",
      "Notify command center",
    ],
    critical: [
      `URGENT: Initiate controlled evacuation of Zone ${zone}`,
      "Close all inflows to this zone",
      "Emergency services on standby",
      "Command center override — escalate immediately",
      "Activate emergency broadcast",
    ],
  };
  return base[riskLevel];
}
