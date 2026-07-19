import { describe, it, expect } from "vitest";
import {
  buildNavigationPrompt,
  buildIncidentTriagePrompt,
  buildCrowdAnalysisPrompt,
  buildTranslationPrompt,
  buildFanPrompt,
  buildModuleSystemInstruction,
} from "../lib/ai-prompts";

describe("buildNavigationPrompt", () => {
  it("includes destination in user prompt", () => {
    const { userPrompt } = buildNavigationPrompt("Section A Gate 5", "Main Entrance");
    expect(userPrompt).toContain("Section A Gate 5");
  });

  it("includes current location in user prompt", () => {
    const { userPrompt } = buildNavigationPrompt("Section A Gate 5", "Main Entrance");
    expect(userPrompt).toContain("Main Entrance");
  });

  it("includes target language in system instruction", () => {
    const { systemInstruction } = buildNavigationPrompt("Gate 1", "Lobby", "Spanish");
    expect(systemInstruction).toContain("Spanish");
  });

  it("mentions accessibility needs in system instruction when provided", () => {
    const { systemInstruction } = buildNavigationPrompt(
      "Gate 1",
      "Lobby",
      "English",
      "wheelchair user"
    );
    expect(systemInstruction).toContain("wheelchair user");
  });

  it("defaults to English when no language specified", () => {
    const { systemInstruction } = buildNavigationPrompt("Gate 1", "Lobby");
    expect(systemInstruction).toContain("English");
  });

  it("returns both systemInstruction and userPrompt", () => {
    const result = buildNavigationPrompt("Gate 1", "Lobby");
    expect(result).toHaveProperty("systemInstruction");
    expect(result).toHaveProperty("userPrompt");
    expect(typeof result.systemInstruction).toBe("string");
    expect(typeof result.userPrompt).toBe("string");
  });
});

describe("buildIncidentTriagePrompt", () => {
  it("includes description in user prompt", () => {
    const { userPrompt } = buildIncidentTriagePrompt("Person collapsed", "Section B");
    expect(userPrompt).toContain("Person collapsed");
  });

  it("includes location in user prompt", () => {
    const { userPrompt } = buildIncidentTriagePrompt("Person collapsed", "Section B");
    expect(userPrompt).toContain("Section B");
  });

  it("requests JSON output in system instruction", () => {
    const { systemInstruction } = buildIncidentTriagePrompt("Fight", "Gate 3");
    expect(systemInstruction).toContain("JSON");
  });

  it("includes optional reportedBy when provided", () => {
    const { userPrompt } = buildIncidentTriagePrompt(
      "Lost child",
      "Zone A",
      "Staff John"
    );
    expect(userPrompt).toContain("Staff John");
  });

  it("does not include reportedBy section when omitted", () => {
    const { userPrompt } = buildIncidentTriagePrompt("Lost child", "Zone A");
    expect(userPrompt).not.toContain("Reported by:");
  });

  it("specifies priority levels in system instruction", () => {
    const { systemInstruction } = buildIncidentTriagePrompt("test", "location");
    expect(systemInstruction).toContain("critical");
    expect(systemInstruction).toContain("high");
    expect(systemInstruction).toContain("medium");
    expect(systemInstruction).toContain("low");
  });
});

describe("buildCrowdAnalysisPrompt", () => {
  it("includes venue name in user prompt", () => {
    const { userPrompt } = buildCrowdAnalysisPrompt("MetLife Stadium", "North Stand", 75);
    expect(userPrompt).toContain("MetLife Stadium");
  });

  it("includes zone in user prompt", () => {
    const { userPrompt } = buildCrowdAnalysisPrompt("MetLife Stadium", "North Stand", 75);
    expect(userPrompt).toContain("North Stand");
  });

  it("includes density value in user prompt", () => {
    const { userPrompt } = buildCrowdAnalysisPrompt("MetLife Stadium", "North Stand", 75);
    expect(userPrompt).toContain("75");
  });

  it("includes match phase when provided", () => {
    const { userPrompt } = buildCrowdAnalysisPrompt(
      "SoFi Stadium",
      "Gate A",
      60,
      "Half-time"
    );
    expect(userPrompt).toContain("Half-time");
  });

  it("returns JSON format specification in system instruction", () => {
    const { systemInstruction } = buildCrowdAnalysisPrompt("Venue", "Zone", 50);
    expect(systemInstruction).toContain("riskLevel");
    expect(systemInstruction).toContain("recommendations");
  });
});

describe("buildTranslationPrompt", () => {
  it("includes target language", () => {
    const { userPrompt } = buildTranslationPrompt("Exit is to the left", "Spanish");
    expect(userPrompt).toContain("Spanish");
  });

  it("includes text to translate", () => {
    const { userPrompt } = buildTranslationPrompt("Exit is to the left", "French");
    expect(userPrompt).toContain("Exit is to the left");
  });

  it("includes source language when provided", () => {
    const { userPrompt } = buildTranslationPrompt("Hello", "Arabic", "English");
    expect(userPrompt).toContain("English");
  });

  it("requests auto-detection when source language omitted", () => {
    const { userPrompt } = buildTranslationPrompt("Hello", "Arabic");
    expect(userPrompt).toContain("Auto-detect");
  });

  it("returns JSON format in system instruction", () => {
    const { systemInstruction } = buildTranslationPrompt("text", "French");
    expect(systemInstruction).toContain("translatedText");
  });
});

describe("buildModuleSystemInstruction", () => {
  it("returns a non-empty string for each module", () => {
    const modules = [
      "navigation",
      "crowd",
      "accessibility",
      "transport",
      "sustainability",
      "multilingual",
      "ops",
      "volunteer",
    ];
    for (const module of modules) {
      const instruction = buildModuleSystemInstruction(module);
      expect(typeof instruction).toBe("string");
      expect(instruction.length).toBeGreaterThan(50);
    }
  });

  it("returns a fallback for unknown modules", () => {
    const instruction = buildModuleSystemInstruction("unknown-module");
    expect(typeof instruction).toBe("string");
    expect(instruction.length).toBeGreaterThan(0);
  });

  it("includes target language in instruction", () => {
    const instruction = buildModuleSystemInstruction("navigation", "Portuguese");
    expect(instruction).toContain("Portuguese");
  });
});

describe("buildFanPrompt", () => {
  it("includes the query in the user prompt", () => {
    const { userPrompt } = buildFanPrompt("Where is the toilet?", "navigation");
    expect(userPrompt).toContain("Where is the toilet?");
  });

  it("includes context in user prompt when provided", () => {
    const { userPrompt } = buildFanPrompt(
      "How do I get there?",
      "navigation",
      "Currently at Section C"
    );
    expect(userPrompt).toContain("Currently at Section C");
  });
});
