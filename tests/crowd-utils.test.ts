import { describe, it, expect } from "vitest";
import {
  crowdDensityToRiskLevel,
  crowdRiskLevelToColor,
  crowdDensityToColor,
  routeScore,
  estimateDispersalTime,
  getCrowdRecommendations,
} from "../artifacts/api-server/src/lib/crowd-utils";

describe("crowdDensityToRiskLevel", () => {
  it("returns 'low' for density below 40%", () => {
    expect(crowdDensityToRiskLevel(0)).toBe("low");
    expect(crowdDensityToRiskLevel(20)).toBe("low");
    expect(crowdDensityToRiskLevel(39)).toBe("low");
  });

  it("returns 'moderate' for density 40-69%", () => {
    expect(crowdDensityToRiskLevel(40)).toBe("moderate");
    expect(crowdDensityToRiskLevel(55)).toBe("moderate");
    expect(crowdDensityToRiskLevel(69)).toBe("moderate");
  });

  it("returns 'high' for density 70-84%", () => {
    expect(crowdDensityToRiskLevel(70)).toBe("high");
    expect(crowdDensityToRiskLevel(77)).toBe("high");
    expect(crowdDensityToRiskLevel(84)).toBe("high");
  });

  it("returns 'critical' for density 85% and above", () => {
    expect(crowdDensityToRiskLevel(85)).toBe("critical");
    expect(crowdDensityToRiskLevel(95)).toBe("critical");
    expect(crowdDensityToRiskLevel(100)).toBe("critical");
  });

  it("throws RangeError for density below 0", () => {
    expect(() => crowdDensityToRiskLevel(-1)).toThrow(RangeError);
  });

  it("throws RangeError for density above 100", () => {
    expect(() => crowdDensityToRiskLevel(101)).toThrow(RangeError);
  });
});

describe("crowdRiskLevelToColor", () => {
  it("returns a hex color string for each risk level", () => {
    const levels = ["low", "moderate", "high", "critical"] as const;
    for (const level of levels) {
      const color = crowdRiskLevelToColor(level);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("returns green for low risk", () => {
    const color = crowdRiskLevelToColor("low");
    expect(color.toLowerCase()).toBe("#22c55e");
  });

  it("returns red for critical risk", () => {
    const color = crowdRiskLevelToColor("critical");
    expect(color.toLowerCase()).toBe("#ef4444");
  });

  it("returns different colors for different risk levels", () => {
    const colors = new Set([
      crowdRiskLevelToColor("low"),
      crowdRiskLevelToColor("moderate"),
      crowdRiskLevelToColor("high"),
      crowdRiskLevelToColor("critical"),
    ]);
    expect(colors.size).toBe(4);
  });
});

describe("crowdDensityToColor", () => {
  it("returns green for low density", () => {
    expect(crowdDensityToColor(20).toLowerCase()).toBe("#22c55e");
  });

  it("returns red for critical density", () => {
    expect(crowdDensityToColor(90).toLowerCase()).toBe("#ef4444");
  });

  it("returns a valid hex color for any density 0-100", () => {
    for (let d = 0; d <= 100; d += 10) {
      expect(crowdDensityToColor(d)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("routeScore", () => {
  it("returns a number between 0 and 100", () => {
    const score = routeScore({
      distanceMeters: 200,
      crowdDensity: 50,
      isAccessible: false,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("shortest routes score higher than longer routes (same crowd)", () => {
    const short = routeScore({ distanceMeters: 100, crowdDensity: 30, isAccessible: false });
    const long = routeScore({ distanceMeters: 800, crowdDensity: 30, isAccessible: false });
    expect(short).toBeGreaterThan(long);
  });

  it("less crowded routes score higher (same distance)", () => {
    const uncrowded = routeScore({ distanceMeters: 200, crowdDensity: 20, isAccessible: false });
    const crowded = routeScore({ distanceMeters: 200, crowdDensity: 90, isAccessible: false });
    expect(uncrowded).toBeGreaterThan(crowded);
  });

  it("accessible routes score higher than non-accessible routes", () => {
    const accessible = routeScore({ distanceMeters: 200, crowdDensity: 50, isAccessible: true });
    const notAccessible = routeScore({ distanceMeters: 200, crowdDensity: 50, isAccessible: false });
    expect(accessible).toBeGreaterThan(notAccessible);
  });

  it("routes with wait time score lower than routes without wait time", () => {
    const noWait = routeScore({ distanceMeters: 200, crowdDensity: 30, isAccessible: false, estimatedWaitSeconds: 0 });
    const withWait = routeScore({ distanceMeters: 200, crowdDensity: 30, isAccessible: false, estimatedWaitSeconds: 300 });
    expect(noWait).toBeGreaterThan(withWait);
  });

  it("never returns a negative score", () => {
    const worstCase = routeScore({
      distanceMeters: 5000,
      crowdDensity: 100,
      isAccessible: false,
      estimatedWaitSeconds: 1800,
    });
    expect(worstCase).toBeGreaterThanOrEqual(0);
  });
});

describe("estimateDispersalTime", () => {
  it("returns a positive number of minutes", () => {
    const time = estimateDispersalTime(50000, 1000, 70);
    expect(time).toBeGreaterThan(0);
  });

  it("takes longer to disperse larger crowds", () => {
    const time50k = estimateDispersalTime(50000, 1000, 50);
    const time100k = estimateDispersalTime(100000, 1000, 50);
    expect(time100k).toBeGreaterThan(time50k);
  });

  it("takes longer at higher crowd density (slower movement)", () => {
    const lowDensity = estimateDispersalTime(50000, 1000, 30);
    const highDensity = estimateDispersalTime(50000, 1000, 90);
    expect(highDensity).toBeGreaterThan(lowDensity);
  });

  it("throws for zero exit capacity", () => {
    expect(() => estimateDispersalTime(50000, 0, 70)).toThrow(RangeError);
  });
});

describe("getCrowdRecommendations", () => {
  it("returns an array of strings", () => {
    const recs = getCrowdRecommendations("low", "North Stand");
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
    expect(typeof recs[0]).toBe("string");
  });

  it("includes the zone name in recommendations", () => {
    const recs = getCrowdRecommendations("high", "Zone C");
    const combined = recs.join(" ");
    expect(combined).toContain("Zone C");
  });

  it("returns more urgent recommendations for critical risk", () => {
    const critical = getCrowdRecommendations("critical", "Zone A");
    const combined = critical.join(" ").toUpperCase();
    expect(combined).toMatch(/URGENT|EMERGENCY|EVACUATE/i);
  });

  it("returns calmer recommendations for low risk", () => {
    const low = getCrowdRecommendations("low", "Zone A");
    const combined = low.join(" ").toLowerCase();
    expect(combined).toMatch(/normal|monitor|standard/i);
  });
});
