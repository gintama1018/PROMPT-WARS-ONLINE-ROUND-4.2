import { describe, it, expect } from "vitest";
import {
  calculateTransportEmissions,
  calculateSavedEmissions,
  getCarbonTier,
  getCarbonTierLabel,
  suggestGreenerAlternatives,
  calculateCollectiveSavings,
} from "../artifacts/api-server/src/lib/carbon-calculator";

describe("calculateTransportEmissions", () => {
  it("returns 0 for walking", () => {
    expect(calculateTransportEmissions("walking", 10)).toBe(0);
  });

  it("returns 0 for bicycle", () => {
    expect(calculateTransportEmissions("bicycle", 10)).toBe(0);
  });

  it("calculates car emissions correctly", () => {
    const expected = 0.192 * 100; // 19.2 kg CO2 for 100km by car
    expect(calculateTransportEmissions("car", 100)).toBeCloseTo(expected);
  });

  it("calculates train emissions (much lower than car)", () => {
    const carEmissions = calculateTransportEmissions("car", 50);
    const trainEmissions = calculateTransportEmissions("train", 50);
    expect(trainEmissions).toBeLessThan(carEmissions);
  });

  it("calculates bus emissions lower than car", () => {
    const carEmissions = calculateTransportEmissions("car", 20);
    const busEmissions = calculateTransportEmissions("bus", 20);
    expect(busEmissions).toBeLessThan(carEmissions);
  });

  it("returns 0 for 0 km distance", () => {
    expect(calculateTransportEmissions("car", 0)).toBe(0);
    expect(calculateTransportEmissions("bus", 0)).toBe(0);
  });

  it("throws for negative distance", () => {
    expect(() => calculateTransportEmissions("car", -10)).toThrow(RangeError);
  });

  it("scales linearly with distance", () => {
    const em10 = calculateTransportEmissions("bus", 10);
    const em20 = calculateTransportEmissions("bus", 20);
    expect(em20).toBeCloseTo(em10 * 2);
  });
});

describe("calculateSavedEmissions", () => {
  it("returns 0 savings for car (baseline)", () => {
    expect(calculateSavedEmissions("car", 100)).toBe(0);
  });

  it("returns positive savings for train vs car", () => {
    expect(calculateSavedEmissions("train", 100)).toBeGreaterThan(0);
  });

  it("returns maximum savings for walking", () => {
    const walkingSavings = calculateSavedEmissions("walking", 100);
    const trainSavings = calculateSavedEmissions("train", 100);
    expect(walkingSavings).toBeGreaterThan(trainSavings);
  });

  it("never returns negative savings", () => {
    const modes = ["car", "bus", "train", "metro", "bicycle", "walking"] as const;
    for (const mode of modes) {
      expect(calculateSavedEmissions(mode, 50)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("getCarbonTier", () => {
  it("returns 'zero' for 0 kg", () => {
    expect(getCarbonTier(0)).toBe("zero");
  });

  it("returns 'low' for < 2 kg", () => {
    expect(getCarbonTier(0.5)).toBe("low");
    expect(getCarbonTier(1.9)).toBe("low");
  });

  it("returns 'medium' for 2-9 kg", () => {
    expect(getCarbonTier(2)).toBe("medium");
    expect(getCarbonTier(9.9)).toBe("medium");
  });

  it("returns 'high' for 10-29 kg", () => {
    expect(getCarbonTier(10)).toBe("high");
    expect(getCarbonTier(29)).toBe("high");
  });

  it("returns 'very-high' for >= 30 kg", () => {
    expect(getCarbonTier(30)).toBe("very-high");
    expect(getCarbonTier(100)).toBe("very-high");
  });
});

describe("getCarbonTierLabel", () => {
  it("returns a human-readable string for each tier", () => {
    const tiers = ["zero", "low", "medium", "high", "very-high"] as const;
    for (const tier of tiers) {
      const label = getCarbonTierLabel(tier);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("includes 'zero' in the zero tier label", () => {
    const label = getCarbonTierLabel("zero").toLowerCase();
    expect(label).toContain("zero");
  });
});

describe("suggestGreenerAlternatives", () => {
  it("returns modes with lower emissions than car", () => {
    const alternatives = suggestGreenerAlternatives("car");
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives).toContain("train");
    expect(alternatives).toContain("walking");
    expect(alternatives).not.toContain("car");
  });

  it("returns no alternatives for walking (already zero emissions)", () => {
    const alternatives = suggestGreenerAlternatives("walking");
    expect(alternatives).not.toContain("car");
    expect(alternatives).not.toContain("walking");
  });

  it("returns no alternatives for bicycle (already zero emissions)", () => {
    const alternatives = suggestGreenerAlternatives("bicycle");
    expect(alternatives.length).toBe(0);
  });
});

describe("calculateCollectiveSavings", () => {
  it("returns 0 for empty fan counts", () => {
    expect(calculateCollectiveSavings({}, 20)).toBe(0);
  });

  it("returns positive savings when fans use public transit", () => {
    const savings = calculateCollectiveSavings({ train: 5000, bus: 3000 }, 30);
    expect(savings).toBeGreaterThan(0);
  });

  it("returns 0 savings when all fans drive", () => {
    const savings = calculateCollectiveSavings({ car: 10000 }, 50);
    expect(savings).toBe(0);
  });

  it("scales with number of fans", () => {
    const savings1000 = calculateCollectiveSavings({ train: 1000 }, 20);
    const savings2000 = calculateCollectiveSavings({ train: 2000 }, 20);
    expect(savings2000).toBeCloseTo(savings1000 * 2);
  });
});
