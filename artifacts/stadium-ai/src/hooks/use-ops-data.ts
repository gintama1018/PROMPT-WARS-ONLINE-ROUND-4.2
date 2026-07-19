import { useQueryClient } from "@tanstack/react-query";
import {
  useListVenues,
  useGetDashboardStats,
  useListIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  getListIncidentsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import type { NewIncidentForm } from "@/lib/types";

/**
 * Central data hook for the Operations Dashboard.
 *
 * Encapsulates all query/mutation wiring and cache invalidation so the
 * page component stays as a thin presentation layer.
 */
export function useOpsData() {
  const queryClient = useQueryClient();

  // ─── Queries ────────────────────────────────────────────────────────────────
  const venuesQuery   = useListVenues();
  const statsQuery    = useGetDashboardStats();
  const incidentsQuery = useListIncidents();

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const createIncident = useCreateIncident();
  const updateIncident = useUpdateIncident();
  const deleteIncident = useDeleteIncident();

  // ─── Cache Invalidation ──────────────────────────────────────────────────────
  /**
   * Refreshes both the incident list and dashboard stats after any write.
   * Kept as a single helper so the three mutation handlers stay DRY.
   */
  const invalidateOpsData = () => {
    void queryClient.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateIncident = async (data: NewIncidentForm) => {
    await createIncident.mutateAsync({ data });
    invalidateOpsData();
  };

  const handleUpdateIncident = async (
    id: number,
    data: Parameters<typeof updateIncident.mutateAsync>[0]["data"]
  ) => {
    await updateIncident.mutateAsync({ id, data });
    invalidateOpsData();
  };

  const handleDeleteIncident = async (id: number) => {
    await deleteIncident.mutateAsync({ id });
    invalidateOpsData();
  };

  // ─── Return ──────────────────────────────────────────────────────────────────
  return {
    venues:    venuesQuery.data    ?? [],
    stats:     statsQuery.data,
    incidents: incidentsQuery.data ?? [],
    isLoading: venuesQuery.isLoading || statsQuery.isLoading || incidentsQuery.isLoading,
    isCreating: createIncident.isPending,
    handleCreateIncident,
    handleUpdateIncident,
    handleDeleteIncident,
  };
}
