import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class strings, resolving conflicts correctly. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Incident Priority Colors ────────────────────────────────────────────────

/**
 * Returns a Tailwind color token string for an incident priority level.
 * Used to color badges, text, and borders consistently across the app.
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "critical": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "high":     return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "medium":   return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "low":      return "text-green-500 bg-green-500/10 border-green-500/20";
    default:         return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  }
}

// ─── Crowd Density Colors ────────────────────────────────────────────────────

/**
 * Returns a Tailwind color token string for a numeric crowd density value.
 * Thresholds mirror the CRITICAL_CAPACITY_THRESHOLD constant.
 */
export function getDensityColor(density: number): string {
  if (density >= 85) return "text-red-500 bg-red-500/10 border-red-500/20";
  if (density >= 70) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
  if (density >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  return "text-green-500 bg-green-500/10 border-green-500/20";
}

/** Returns a solid background Tailwind class for use in progress bars. */
export function getDensityProgressColor(density: number): string {
  if (density >= 85) return "bg-red-500";
  if (density >= 70) return "bg-orange-500";
  if (density >= 40) return "bg-amber-500";
  return "bg-green-500";
}

/**
 * Returns a Tailwind color token string for an AI-returned crowd risk level.
 * Handles the string values returned by the /ai/crowd-analysis endpoint.
 */
export function getCrowdRiskColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case "critical":
    case "high":
      return "text-red-400 border-red-400/50 bg-red-400/10";
    case "medium":
    case "moderate":
      return "text-amber-400 border-amber-400/50 bg-amber-400/10";
    default:
      return "text-green-400 border-green-400/50 bg-green-400/10";
  }
}
