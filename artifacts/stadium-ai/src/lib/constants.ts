export const modules = [
  { id: "Navigation", label: "Navigation" },
  { id: "Accessibility", label: "Accessibility" },
  { id: "Transport", label: "Transport" },
  { id: "Multilingual", label: "Multilingual" }
] as const;

export const priorities = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
] as const;

export const status = [
  { id: "open", label: "Open" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" }
] as const;
