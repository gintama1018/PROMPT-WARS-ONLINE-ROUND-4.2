import type { NewIncidentForm } from "./types";

// ─── Ops Modules ────────────────────────────────────────────────────────────

export const modules = [
  { id: "Navigation",   label: "Navigation"   },
  { id: "Accessibility", label: "Accessibility" },
  { id: "Transport",    label: "Transport"    },
  { id: "Multilingual", label: "Multilingual" },
] as const;

// ─── Incident Priorities ─────────────────────────────────────────────────────

export const priorities = [
  { id: "critical", label: "Critical" },
  { id: "high",     label: "High"     },
  { id: "medium",   label: "Medium"   },
  { id: "low",      label: "Low"      },
] as const;

// ─── Incident Statuses ───────────────────────────────────────────────────────

export const statuses = [
  { id: "open",        label: "Open"        },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved"    },
] as const;

// ─── Crowd Capacity Thresholds ───────────────────────────────────────────────

/** Crowd density % at which a venue is considered dangerously overcrowded. */
export const CRITICAL_CAPACITY_THRESHOLD = 85;

// ─── Incident Form Defaults ──────────────────────────────────────────────────

/** Initial state for the "Report New Incident" form — single source of truth. */
export const INCIDENT_DEFAULTS: NewIncidentForm = {
  title:       "",
  description: "",
  location:    "",
  module:      modules[0].id,
  priority:    "low",
};
