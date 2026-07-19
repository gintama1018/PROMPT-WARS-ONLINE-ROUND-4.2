import { describe, it, expect } from "vitest";

// Set GEMINI_API_KEY before importing ai-client to prevent it from throwing
process.env.GEMINI_API_KEY = "mock-api-key";

import { parseJsonResponse } from "../artifacts/api-server/src/lib/ai-client";

describe("parseJsonResponse", () => {
  it("parses valid JSON directly", () => {
    const json = '{"foo": "bar"}';
    expect(parseJsonResponse(json, { foo: "fallback" })).toEqual({ foo: "bar" });
  });

  it("strips ```json markdown fences", () => {
    const json = '```json\n{"foo": "bar"}\n```';
    expect(parseJsonResponse(json, { foo: "fallback" })).toEqual({ foo: "bar" });
  });

  it("strips generic ``` markdown fences", () => {
    const json = '```\n{"foo": "bar"}\n```';
    expect(parseJsonResponse(json, { foo: "fallback" })).toEqual({ foo: "bar" });
  });

  it("returns fallback on invalid JSON", () => {
    const json = 'invalid';
    expect(parseJsonResponse(json, { foo: "fallback" })).toEqual({ foo: "fallback" });
  });
});
