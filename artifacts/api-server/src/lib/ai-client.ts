import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger.js";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const MODEL = "gemini-2.5-flash";

export interface GenerateOptions {
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Generate a text response from Gemini.
 */
export async function generateContent(
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { systemInstruction, maxOutputTokens = 8192, temperature } = options;

  try {
    const response = await getAiClient().models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        maxOutputTokens,
        ...(temperature !== undefined ? { temperature } : {}),
      },
    });
    return response.text ?? "";
  } catch (err) {
    logger.error({ err }, "Gemini generateContent error");
    throw err;
  }
}

/**
 * Generate content from a multi-turn conversation history.
 */
export async function generateFromHistory(
  messages: Array<{ role: "user" | "model"; content: string }>,
  options: GenerateOptions = {}
): Promise<string> {
  const { systemInstruction, maxOutputTokens = 8192 } = options;

  try {
    const response = await getAiClient().models.generateContent({
      model: MODEL,
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        maxOutputTokens,
      },
    });
    return response.text ?? "";
  } catch (err) {
    logger.error({ err }, "Gemini generateFromHistory error");
    throw err;
  }
}

/**
 * Parse a JSON response from Gemini, with fallback.
 */
export function parseJsonResponse<T>(text: string, fallback: T): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    logger.warn({ text: cleaned }, "Failed to parse Gemini JSON response");
    return fallback;
  }
}
