/**
 * AI Prompt builders — pure functions, fully testable.
 * Each function takes structured input and returns a prompt string + system instruction.
 */

export interface PromptResult {
  systemInstruction: string;
  userPrompt: string;
}

const FIFA_CONTEXT = `You are StadiumAI, the official AI assistant for the FIFA World Cup 2026. 
The tournament spans 16 stadiums across the USA, Canada, and Mexico.
You help fans, staff, volunteers, and organizers have a safe, accessible, and enjoyable experience.
Always be concise, helpful, and safety-conscious. Never provide harmful or misleading information.`;

/**
 * Build a prompt for the navigation assistant module.
 */
export function buildNavigationPrompt(
  destination: string,
  currentLocation: string,
  language = "English",
  accessibilityNeeds?: string
): PromptResult {
  const accessibilityNote = accessibilityNeeds
    ? `The user has the following accessibility needs: ${accessibilityNeeds}. Prioritize accessible routes.`
    : "";

  return {
    systemInstruction: `${FIFA_CONTEXT}
You are the Navigation Assistant. Help fans find their way around the stadium safely and efficiently.
Respond in ${language}. ${accessibilityNote}
Always mention: estimated walking time, key landmarks, and accessibility options if relevant.`,
    userPrompt: `I am currently at ${currentLocation} and need to get to ${destination}. 
Please provide clear step-by-step navigation directions with estimated walking time.`,
  };
}

/**
 * Build a prompt for AI incident triage.
 */
export function buildIncidentTriagePrompt(
  description: string,
  location: string,
  reportedBy?: string
): PromptResult {
  return {
    systemInstruction: `${FIFA_CONTEXT}
You are the Incident Triage AI for stadium operations staff.
Analyze incidents and respond ONLY with valid JSON in this exact format:
{
  "priority": "critical|high|medium|low",
  "category": "medical|security|crowd|infrastructure|logistics|other",
  "suggestedActions": ["action1", "action2", "action3"],
  "estimatedResolutionTime": "5-10 minutes"
}
Priority guide: critical=life-threatening/immediate danger, high=injury/significant disruption, medium=moderate disruption, low=minor issue.`,
    userPrompt: `Incident Report:
Description: ${description}
Location: ${location}
${reportedBy ? `Reported by: ${reportedBy}` : ""}

Provide triage assessment in JSON format.`,
  };
}

/**
 * Build a prompt for crowd density analysis.
 */
export function buildCrowdAnalysisPrompt(
  venue: string,
  zone: string,
  density: number,
  matchPhase?: string
): PromptResult {
  return {
    systemInstruction: `${FIFA_CONTEXT}
You are the Crowd Management AI. Analyze crowd density data and provide operational recommendations.
Respond ONLY with valid JSON in this exact format:
{
  "riskLevel": "low|moderate|high|critical",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "alertMessage": "optional urgent message or null"
}
Density scale: 0-39=low, 40-69=moderate, 70-84=high, 85-100=critical.`,
    userPrompt: `Venue: ${venue}
Zone: ${zone}
Current density: ${density}% capacity
${matchPhase ? `Match phase: ${matchPhase}` : ""}

Provide crowd management assessment and recommendations in JSON format.`,
  };
}

/**
 * Build a prompt for multilingual translation.
 */
export function buildTranslationPrompt(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): PromptResult {
  return {
    systemInstruction: `${FIFA_CONTEXT}
You are the Multilingual Translation AI. Provide accurate, natural translations for stadium communications.
Respond ONLY with valid JSON in this exact format:
{
  "translatedText": "the translated text",
  "detectedLanguage": "detected source language name or null"
}
Maintain the original tone and any urgency level in the translation.`,
    userPrompt: `Translate the following text to ${targetLanguage}:
${sourceLanguage ? `(Source language: ${sourceLanguage})` : "(Auto-detect source language)"}

Text: "${text}"

Respond with JSON only.`,
  };
}

/**
 * Build a system instruction for a specific AI module.
 */
export function buildModuleSystemInstruction(
  module: string,
  language = "English"
): string {
  const moduleInstructions: Record<string, string> = {
    navigation: `${FIFA_CONTEXT}
You are the Fan Navigation Assistant. Help fans find their way around the stadium.
Provide clear directions, walking times, and accessibility information.
Respond in ${language}.`,

    crowd: `${FIFA_CONTEXT}
You are the Crowd Management Assistant for operations staff.
Help staff manage crowd flow, identify bottlenecks, and prevent crush situations.
Provide data-driven recommendations.`,

    accessibility: `${FIFA_CONTEXT}
You are the Accessibility Services Assistant.
Help fans with disabilities navigate the venue, find accessible facilities, and request support.
Be empathetic, patient, and thorough. Respond in ${language}.`,

    transport: `${FIFA_CONTEXT}
You are the Transport Planning Assistant.
Help fans plan their journey to/from the stadium, including public transit, parking, and ride-sharing.
Consider match schedules, traffic patterns, and post-match crowd dispersal. Respond in ${language}.`,

    sustainability: `${FIFA_CONTEXT}
You are the Sustainability Assistant.
Help staff and fans track environmental impact, find eco-friendly options, and contribute to the tournament's carbon reduction goals.`,

    multilingual: `${FIFA_CONTEXT}
You are the Multilingual Communication Assistant.
Help with real-time translation and communication support for fans and staff from around the world.
Support 32 languages for the FIFA World Cup 2026.`,

    ops: `${FIFA_CONTEXT}
You are the Operations Intelligence Assistant for venue management staff.
Help with resource allocation, incident tracking, staff coordination, and real-time decision support.`,

    volunteer: `${FIFA_CONTEXT}
You are the Volunteer Coordination Assistant.
Help volunteers understand their roles, find their assignments, and support fans effectively.`,
  };

  return (
    moduleInstructions[module] ??
    `${FIFA_CONTEXT}\nYou are a helpful stadium operations assistant. Respond in ${language}.`
  );
}

/**
 * Build a general fan-facing AI prompt.
 */
export function buildFanPrompt(
  query: string,
  module: string,
  context?: string,
  language = "English"
): PromptResult {
  return {
    systemInstruction: buildModuleSystemInstruction(module, language),
    userPrompt: context ? `Context: ${context}\n\nUser question: ${query}` : query,
  };
}
