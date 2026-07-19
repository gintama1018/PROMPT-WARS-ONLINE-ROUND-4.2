import { ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPriorityColor, cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Incident {
  id: number;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
}

interface IncidentFeedProps {
  /** Pre-filtered list of active (non-resolved) incidents. */
  incidents: Incident[];
  onResolve: (id: number) => void;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      No active incidents.
    </div>
  );
}

interface IncidentRowProps {
  incident: Incident;
  onResolve: (id: number) => void;
}

function IncidentRow({ incident, onResolve }: IncidentRowProps) {
  return (
    <tr className="hover:bg-secondary/20 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
        {incident.status}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <Badge
          variant="outline"
          className={cn("uppercase text-[10px]", getPriorityColor(incident.priority))}
        >
          {incident.priority}
        </Badge>
      </td>

      <td className="px-6 py-4">
        <div className="font-medium text-foreground">{incident.title}</div>
        <div className="text-muted-foreground text-xs truncate max-w-[200px] mt-1">
          {incident.description}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
        {incident.location}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onResolve(incident.id)}
        >
          Resolve
        </Button>
      </td>
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * Renders the live incident feed table.
 * Expects `incidents` to already be filtered to active-only so this
 * component has no knowledge of the "resolved" business rule.
 */
export function IncidentFeed({ incidents, onResolve }: IncidentFeedProps) {
  const hasActiveIncidents = incidents.length > 0;

  return (
    <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Live Incident Feed
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1">
        {hasActiveIncidents ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground font-mono text-xs uppercase sticky top-0 backdrop-blur">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Incident</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onResolve={onResolve}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState />
        )}
      </ScrollArea>
    </Card>
  );
}
