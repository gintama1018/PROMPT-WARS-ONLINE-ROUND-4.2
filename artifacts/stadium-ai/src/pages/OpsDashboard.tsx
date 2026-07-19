import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Activity,
  Plus,
} from "lucide-react";
import { useOpsData } from "@/hooks/use-ops-data";
import { StatCard }           from "@/components/ops/StatCard";
import { IncidentFeed }       from "@/components/ops/IncidentFeed";
import { CrowdAnalysisPanel } from "@/components/ops/CrowdAnalysisPanel";
import { ReportIncidentModal } from "@/components/ops/ReportIncidentModal";
import { Button } from "@/components/ui/button";
import { CRITICAL_CAPACITY_THRESHOLD } from "@/lib/constants";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Operations Command Center page.
 *
 * This component is a thin orchestration layer — it fetches shared data
 * via `useOpsData`, derives a few computed values, and composes the four
 * specialised sub-components. No business logic lives here.
 */
export default function OpsDashboard() {
  const {
    stats,
    incidents,
    venues,
    isLoading,
    isCreating,
    handleCreateIncident,
    handleUpdateIncident,
  } = useOpsData();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Derived values ────────────────────────────────────────────────────────

  /** Pre-filter once so neither IncidentFeed nor the empty-state check does it twice. */
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");

  /** Highlight capacity value in red once it crosses the danger threshold. */
  const isOverCapacity =
    stats !== undefined && stats.crowdCapacityPercent >= CRITICAL_CAPACITY_THRESHOLD;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Operations Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time venue analytics and incident management.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Venues"
          value={isLoading ? undefined : stats?.activeVenues}
          Icon={MapPin}
        />
        <StatCard
          label="Network Capacity"
          value={isLoading ? undefined : stats ? `${stats.crowdCapacityPercent}%` : undefined}
          Icon={Activity}
          valueColorClass={isOverCapacity ? "text-red-500" : undefined}
        />
        <StatCard
          label="Critical Incidents"
          value={isLoading ? undefined : stats?.criticalIncidents}
          Icon={AlertTriangle}
          labelColorClass="text-red-500"
          valueColorClass="text-red-500"
        />
        <StatCard
          label="Resolved Today"
          value={isLoading ? undefined : stats?.resolvedToday}
          Icon={CheckCircle2}
          labelColorClass="text-green-600"
          valueColorClass="text-green-600"
        />
      </div>

      {/* ── Main Content: Feed + Crowd Panel ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <IncidentFeed
          incidents={activeIncidents}
          onResolve={(id) => handleUpdateIncident(id, { status: "resolved" })}
        />
        <CrowdAnalysisPanel venues={venues} />
      </div>

      {/* ── Report Incident Modal ─────────────────────────────────────────── */}
      <ReportIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateIncident}
        isSubmitting={isCreating}
      />
    </div>
  );
}
