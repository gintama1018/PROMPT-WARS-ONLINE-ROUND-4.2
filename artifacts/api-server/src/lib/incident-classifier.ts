/**
 * Incident classification utilities — pure functions, fully testable.
 * Rule-based fallback logic used when AI is unavailable.
 */

export type IncidentPriority = "critical" | "high" | "medium" | "low";
export type IncidentCategory =
  | "medical"
  | "security"
  | "crowd"
  | "infrastructure"
  | "logistics"
  | "other";

const CRITICAL_KEYWORDS = [
  "cardiac arrest",
  "heart attack",
  "unconscious",
  "not breathing",
  "severe bleeding",
  "fire",
  "explosion",
  "terrorist",
  "active shooter",
  "stampede",
  "crush",
  "collapse",
  "fatality",
  "dead",
  "bomb",
];

const HIGH_KEYWORDS = [
  "injury",
  "injured",
  "broken",
  "fracture",
  "bleeding",
  "fight",
  "assault",
  "panic",
  "trapped",
  "evacuation",
  "smoke",
  "power outage",
  "structural",
  "flood",
  "medical emergency",
];

const MEDIUM_KEYWORDS = [
  "crowd surge",
  "blocked",
  "congestion",
  "argument",
  "lost child",
  "missing person",
  "accessibility",
  "wheelchair",
  "disruptive",
  "harassment",
  "intoxicated",
  "minor injury",
  "first aid",
];

const CATEGORY_KEYWORDS: Record<IncidentCategory, string[]> = {
  medical: [
    "cardiac",
    "heart",
    "breathing",
    "unconscious",
    "injury",
    "injured",
    "bleeding",
    "fracture",
    "medical",
    "ambulance",
    "first aid",
    "seizure",
    "diabetic",
  ],
  security: [
    "fight",
    "assault",
    "theft",
    "stolen",
    "threat",
    "weapon",
    "bomb",
    "terrorist",
    "shooter",
    "violence",
    "harassment",
  ],
  crowd: [
    "crowd",
    "crush",
    "stampede",
    "surge",
    "congestion",
    "blocked",
    "bottleneck",
    "evacuation",
    "panic",
  ],
  infrastructure: [
    "power",
    "outage",
    "structural",
    "collapse",
    "fire",
    "smoke",
    "flood",
    "elevator",
    "escalator",
    "toilet",
    "roof",
  ],
  logistics: [
    "lost",
    "missing",
    "directions",
    "parking",
    "transport",
    "delay",
    "gate",
    "ticket",
    "volunteer",
  ],
  other: [],
};

/**
 * Classify incident priority based on description keywords.
 * Returns 'critical', 'high', 'medium', or 'low'.
 */
export function classifyIncidentPriority(description: string): IncidentPriority {
  const lower = description.toLowerCase();

  if (CRITICAL_KEYWORDS.some((kw) => lower.includes(kw))) return "critical";
  if (HIGH_KEYWORDS.some((kw) => lower.includes(kw))) return "high";
  if (MEDIUM_KEYWORDS.some((kw) => lower.includes(kw))) return "medium";
  return "low";
}

/**
 * Classify incident into a category based on description keywords.
 */
export function classifyIncidentCategory(description: string): IncidentCategory {
  const lower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as IncidentCategory;
    }
  }

  return "other";
}

/**
 * Get suggested response actions for a given priority and category.
 */
export function getSuggestedActions(
  priority: IncidentPriority,
  category: IncidentCategory
): string[] {
  const baseActions: Record<IncidentPriority, string[]> = {
    critical: [
      "Immediately dispatch emergency services",
      "Alert venue command center",
      "Begin evacuation protocols if necessary",
      "Clear the area of non-essential personnel",
    ],
    high: [
      "Dispatch security and first aid team",
      "Monitor situation closely",
      "Notify area supervisor",
      "Document incident details",
    ],
    medium: [
      "Send nearest available staff member",
      "Log incident for tracking",
      "Monitor for escalation",
    ],
    low: ["Note for end-of-shift report", "Handle at next available opportunity"],
  };

  const categoryActions: Partial<Record<IncidentCategory, string[]>> = {
    medical: ["Contact stadium paramedic team", "Clear space for medical access"],
    security: ["Alert security command", "Review nearby CCTV footage"],
    crowd: ["Open additional exit gates", "Deploy crowd management staff"],
    infrastructure: ["Contact facilities management", "Isolate affected area if unsafe"],
    logistics: ["Use radio to coordinate response", "Check digital wayfinding system"],
  };

  return [...baseActions[priority], ...(categoryActions[category] ?? [])];
}

/**
 * Estimate resolution time based on priority.
 */
export function estimateResolutionTime(priority: IncidentPriority): string {
  const estimates: Record<IncidentPriority, string> = {
    critical: "Immediate response required — 0-5 minutes",
    high: "5-15 minutes",
    medium: "15-30 minutes",
    low: "30-60 minutes or next available slot",
  };
  return estimates[priority];
}
