import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import {
  AskAIBody,
  TriageIncidentBody,
  AnalyzeCrowdBody,
  TranslateTextBody,
} from "@workspace/api-zod";
import { generateContent, parseJsonResponse } from "../../lib/ai-client";
import {
  buildFanPrompt,
  buildIncidentTriagePrompt,
  buildCrowdAnalysisPrompt,
  buildTranslationPrompt,
} from "../../lib/ai-prompts";
import {
  classifyIncidentPriority,
  classifyIncidentCategory,
  getSuggestedActions,
  estimateResolutionTime,
} from "../../lib/incident-classifier";
import { crowdDensityToRiskLevel, getCrowdRecommendations } from "../../lib/crowd-utils";

const router: IRouter = Router();

/**
 * 50 AI requests per IP per 15-minute window.
 *
 * `req.ip` is safe here because `app.set("trust proxy", 1)` is configured in
 * app.ts, which means Express correctly resolves the real client IP from the
 * X-Forwarded-For header rather than the proxy's IP.  The previous hand-rolled
 * keyGenerator that parsed x-forwarded-for directly was bypassable — an
 * attacker could cycle IPs by rotating the header value themselves.
 */
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many AI requests. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  // req.ip is now the real client IP thanks to trust proxy — no manual header parsing needed
});

/** POST /api/ai/ask — general AI assistant for any module */
router.post("/ai/ask", aiRateLimit, async (req, res): Promise<void> => {
  const parsed = AskAIBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { module, query, context, language } = parsed.data;
  const { systemInstruction, userPrompt } = buildFanPrompt(
    query,
    module,
    context ?? undefined,
    language ?? undefined
  );

  try {
    const answer = await generateContent(userPrompt, { systemInstruction });
    res.json({ answer, module, suggestions: [] });
  } catch (err) {
    req.log.error({ err }, "AI ask failed");
    res
      .status(503)
      .json({ error: "AI service temporarily unavailable. Please try again." });
  }
});

/** POST /api/ai/incident-triage — AI-powered incident classification */
router.post("/ai/incident-triage", aiRateLimit, async (req, res): Promise<void> => {
  const parsed = TriageIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description, location, reportedBy } = parsed.data;

  // Rule-based fallback — always computed so we can fall back if AI fails
  const fallbackPriority = classifyIncidentPriority(description);
  const fallbackCategory = classifyIncidentCategory(description);
  const fallback = {
    priority: fallbackPriority,
    category: fallbackCategory,
    suggestedActions: getSuggestedActions(fallbackPriority, fallbackCategory),
    estimatedResolutionTime: estimateResolutionTime(fallbackPriority),
  };

  const { systemInstruction, userPrompt } = buildIncidentTriagePrompt(
    description,
    location,
    reportedBy ?? undefined
  );

  try {
    const text = await generateContent(userPrompt, {
      systemInstruction,
      temperature: 0.3,
    });
    const result = parseJsonResponse(text, fallback);
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "AI triage failed, using rule-based fallback");
    res.json(fallback);
  }
});

/** POST /api/ai/crowd-analysis — AI crowd density analysis */
router.post("/ai/crowd-analysis", aiRateLimit, async (req, res): Promise<void> => {
  const parsed = AnalyzeCrowdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { venue, zone, density, matchPhase } = parsed.data;

  const riskLevel = crowdDensityToRiskLevel(density);
  const fallback = {
    riskLevel,
    recommendations: getCrowdRecommendations(riskLevel, zone),
    alertMessage:
      riskLevel === "critical"
        ? `URGENT: Critical crowd density detected in ${zone} at ${venue}`
        : null,
  };

  const { systemInstruction, userPrompt } = buildCrowdAnalysisPrompt(
    venue,
    zone,
    density,
    matchPhase ?? undefined
  );

  try {
    const text = await generateContent(userPrompt, {
      systemInstruction,
      temperature: 0.2,
    });
    const result = parseJsonResponse(text, fallback);
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "AI crowd analysis failed, using rule-based fallback");
    res.json(fallback);
  }
});

/** POST /api/ai/translate — multilingual translation */
router.post("/ai/translate", aiRateLimit, async (req, res): Promise<void> => {
  const parsed = TranslateTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, targetLanguage, sourceLanguage } = parsed.data;
  const { systemInstruction, userPrompt } = buildTranslationPrompt(
    text,
    targetLanguage,
    sourceLanguage ?? undefined
  );

  try {
    const responseText = await generateContent(userPrompt, {
      systemInstruction,
      temperature: 0.1,
    });
    const result = parseJsonResponse(responseText, {
      translatedText: text,
      detectedLanguage: null,
    });
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "AI translate failed");
    res.json({ translatedText: text, detectedLanguage: null });
  }
});

export default router;
