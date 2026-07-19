import { describe, it, expect } from "vitest";
import {
  classifyIncidentPriority,
  classifyIncidentCategory,
  getSuggestedActions,
  estimateResolutionTime,
} from "../artifacts/api-server/src/lib/incident-classifier";

describe("classifyIncidentPriority", () => {
  it("returns 'critical' for cardiac arrest", () => {
    expect(classifyIncidentPriority("Person in cardiac arrest near Gate 5")).toBe("critical");
  });

  it("returns 'critical' for fire", () => {
    expect(classifyIncidentPriority("Small fire reported in concession stand area")).toBe("critical");
  });

  it("returns 'critical' for stampede", () => {
    expect(classifyIncidentPriority("Potential stampede forming at north exit")).toBe("critical");
  });

  it("returns 'critical' for explosion", () => {
    expect(classifyIncidentPriority("Explosion heard near parking lot B")).toBe("critical");
  });

  it("returns 'critical' for unconscious person", () => {
    expect(classifyIncidentPriority("Fan unconscious near Row 12")).toBe("critical");
  });

  it("returns 'high' for fight/assault", () => {
    expect(classifyIncidentPriority("Fight broke out between fans in Section 23")).toBe("high");
  });

  it("returns 'high' for injury", () => {
    expect(classifyIncidentPriority("Fan reported injured after fall on stairs")).toBe("high");
  });

  it("returns 'high' for minor bleeding", () => {
    // Note: "severe bleeding" is CRITICAL per CRITICAL_KEYWORDS — correct clinical behavior
    expect(classifyIncidentPriority("Fan with bleeding from a small cut")).toBe("high");
  });

  it("returns 'high' for evacuation", () => {
    expect(classifyIncidentPriority("Emergency evacuation needed in north block")).toBe("high");
  });

  it("returns 'medium' for lost child", () => {
    expect(classifyIncidentPriority("Lost child found near souvenir shop")).toBe("medium");
  });

  it("returns 'medium' for crowd surge", () => {
    expect(classifyIncidentPriority("Crowd surge at main entrance gate")).toBe("medium");
  });

  it("returns 'medium' for intoxicated fan", () => {
    expect(classifyIncidentPriority("Intoxicated fan being disruptive in Section 10")).toBe("medium");
  });

  it("returns 'low' for routine complaint", () => {
    expect(classifyIncidentPriority("Fan complaint about seat view")).toBe("low");
  });

  it("returns 'low' for empty description", () => {
    expect(classifyIncidentPriority("")).toBe("low");
  });

  it("is case-insensitive", () => {
    expect(classifyIncidentPriority("CARDIAC ARREST AT SECTION B")).toBe("critical");
    expect(classifyIncidentPriority("FIGHT near gate 2")).toBe("high");
  });
});

describe("classifyIncidentCategory", () => {
  it("returns 'medical' for cardiac arrest", () => {
    expect(classifyIncidentCategory("Cardiac arrest near exit")).toBe("medical");
  });

  it("returns 'medical' for seizure", () => {
    expect(classifyIncidentCategory("Fan having seizure in stands")).toBe("medical");
  });

  it("returns 'security' for fight", () => {
    expect(classifyIncidentCategory("Fans fighting at Gate 3")).toBe("security");
  });

  it("returns 'security' for theft", () => {
    expect(classifyIncidentCategory("Wallet stolen in men's bathroom")).toBe("security");
  });

  it("returns 'crowd' for congestion", () => {
    expect(classifyIncidentCategory("Severe congestion at North entrance")).toBe("crowd");
  });

  it("returns 'crowd' for crowd surge", () => {
    expect(classifyIncidentCategory("Dangerous crowd surge detected")).toBe("crowd");
  });

  it("returns 'infrastructure' for power outage", () => {
    expect(classifyIncidentCategory("Power outage in Sections 40-50")).toBe("infrastructure");
  });

  it("returns 'logistics' for lost person", () => {
    expect(classifyIncidentCategory("Lost fan looking for Section 22")).toBe("logistics");
  });

  it("returns 'other' for unrecognized description", () => {
    expect(classifyIncidentCategory("General complaint")).toBe("other");
  });
});

describe("getSuggestedActions", () => {
  it("returns array of strings", () => {
    const actions = getSuggestedActions("critical", "medical");
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);
    expect(typeof actions[0]).toBe("string");
  });

  it("includes emergency dispatch for critical priority", () => {
    const actions = getSuggestedActions("critical", "other");
    const combined = actions.join(" ").toLowerCase();
    expect(combined).toMatch(/emergency|dispatch|evacuate|command/i);
  });

  it("includes medical-specific actions for medical category", () => {
    const actions = getSuggestedActions("high", "medical");
    const combined = actions.join(" ").toLowerCase();
    expect(combined).toMatch(/medical|paramedic|first aid/i);
  });

  it("includes security-specific actions for security category", () => {
    const actions = getSuggestedActions("high", "security");
    const combined = actions.join(" ").toLowerCase();
    expect(combined).toMatch(/security|cctv|camera/i);
  });

  it("returns fewer actions for low priority", () => {
    const lowActions = getSuggestedActions("low", "other");
    const criticalActions = getSuggestedActions("critical", "other");
    expect(lowActions.length).toBeLessThanOrEqual(criticalActions.length);
  });
});

describe("estimateResolutionTime", () => {
  it("returns immediate response for critical priority", () => {
    const time = estimateResolutionTime("critical");
    expect(time.toLowerCase()).toMatch(/immediate|0-5/);
  });

  it("returns short time for high priority", () => {
    const time = estimateResolutionTime("high");
    expect(time).toContain("5");
  });

  it("returns medium time for medium priority", () => {
    const time = estimateResolutionTime("medium");
    expect(time).toContain("15");
  });

  it("returns longer time for low priority", () => {
    const time = estimateResolutionTime("low");
    expect(time).toContain("30");
  });

  it("returns a non-empty string for all priorities", () => {
    const priorities = ["critical", "high", "medium", "low"] as const;
    for (const p of priorities) {
      const time = estimateResolutionTime(p);
      expect(typeof time).toBe("string");
      expect(time.length).toBeGreaterThan(0);
    }
  });
});
