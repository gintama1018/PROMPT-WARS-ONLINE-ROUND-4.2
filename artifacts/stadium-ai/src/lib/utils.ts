import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "low": return "text-green-500 bg-green-500/10 border-green-500/20";
    default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  }
}

export function getDensityColor(density: number) {
  if (density >= 85) return "text-red-500 bg-red-500/10 border-red-500/20";
  if (density >= 70) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
  if (density >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  return "text-green-500 bg-green-500/10 border-green-500/20";
}

export function getDensityProgressColor(density: number) {
  if (density >= 85) return "bg-red-500";
  if (density >= 70) return "bg-orange-500";
  if (density >= 40) return "bg-amber-500";
  return "bg-green-500";
}
