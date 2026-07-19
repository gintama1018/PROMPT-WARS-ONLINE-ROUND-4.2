/**
 * Shared domain types for the Ops module.
 * Kept separate from generated API types so UI-layer shapes
 * can diverge from wire shapes without touching generated code.
 */

/** Form state for the "Report New Incident" modal. */
export interface NewIncidentForm {
  title: string;
  description: string;
  location: string;
  module: string;
  priority: string;
}

/** Response shape from the AI crowd-analysis endpoint. */
export interface CrowdAnalysisResult {
  riskLevel: string;
  recommendations: string[];
  alertMessage?: string | null;
}
