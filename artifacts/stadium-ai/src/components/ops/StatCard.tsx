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
 * Accepts separate color props for label/icon and value so the
 * "Critical Capacity" card can warn on the number alone without
 * recoloring its label.
 */
export function StatCard({
  label,
  value,
  Icon,
  labelColorClass = "text-muted-foreground",
  valueColorClass,
}: StatCardProps) {
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
          <Icon className={cn("h-4 w-4", labelColorClass)} />
        </div>

        <div className={cn("text-3xl font-bold font-mono", valueColorClass)}>
          {/* Render an em-dash when data is still loading */}
          {value ?? "—"}
        </div>
      </CardContent>
    </Card>
  );
}
