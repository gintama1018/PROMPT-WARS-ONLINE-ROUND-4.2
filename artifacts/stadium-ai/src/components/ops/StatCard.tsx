import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  /** Raw value — pass `undefined` while loading; the card renders "—". */
  value: string | number | undefined;
  Icon: LucideIcon;
  /** Tailwind text-color class applied to the label and icon (e.g. "text-red-500"). */
  labelColorClass?: string;
  /** Tailwind text-color class applied to the large numeric value only. */
  valueColorClass?: string;
}

/**
 * Single stat display card used in the Ops Dashboard stats row.
 *
 * A11y notes:
 * - The icon is purely decorative; aria-hidden removes it from the a11y tree.
 * - The value `div` carries a full aria-label so screen readers announce
 *   "Critical Incidents: 3" rather than just the raw number "3".
 *   This is especially important when colour conveys status (red = danger).
 * - While loading, aria-label reads "Critical Incidents: loading" instead of "—".
 */
export function StatCard({
  label,
  value,
  Icon,
  labelColorClass = "text-muted-foreground",
  valueColorClass,
}: StatCardProps) {
  const isLoading = value === undefined;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={cn(
            "text-sm font-medium font-mono uppercase tracking-wider",
            labelColorClass
          )}>
            {label}
          </span>
          {/* Decorative icon — hidden from the accessibility tree */}
          <Icon className={cn("h-4 w-4", labelColorClass)} aria-hidden="true" />
        </div>

        {/*
         * aria-label conveys both the metric name AND its value in a single
         * announcement — so a screen reader reading the stats row says
         * "Active Venues: 12", "Critical Incidents: 3", not just "12", "3".
         * Without this, the colored numbers are meaningless out of context.
         */}
        <div
          className={cn("text-3xl font-bold font-mono", valueColorClass)}
          aria-label={isLoading ? `${label}: loading` : `${label}: ${value}`}
          aria-busy={isLoading}
        >
          {value ?? "—"}
        </div>
      </CardContent>
    </Card>
  );
}
