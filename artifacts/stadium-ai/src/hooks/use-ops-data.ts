import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListVenues,
  useGetDashboardStats,
  useListIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useTriageIncident,
  useAnalyzeCrowd,
  useTranslateText,
  getListIncidentsQueryKey,
  getListVenuesQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";

export function useOpsData() {
  const queryClient = useQueryClient();

  const venuesQuery = useListVenues();
  const statsQuery = useGetDashboardStats();
  const incidentsQuery = useListIncidents();

  const createIncident = useCreateIncident();
  const updateIncident = useUpdateIncident();
  const deleteIncident = useDeleteIncident();

  const handleCreateIncident = async (data: Parameters<typeof createIncident.mutateAsync>[0]["data"]) => {
    await createIncident.mutateAsync({ data });
    queryClient.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const handleUpdateIncident = async (id: number, data: Parameters<typeof updateIncident.mutateAsync>[0]["data"]) => {
    await updateIncident.mutateAsync({ id, data });
    queryClient.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const handleDeleteIncident = async (id: number) => {
    await deleteIncident.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  return {
    venues: venuesQuery.data || [],
    stats: statsQuery.data,
    incidents: incidentsQuery.data || [],
    isLoading: venuesQuery.isLoading || statsQuery.isLoading || incidentsQuery.isLoading,
    handleCreateIncident,
    handleUpdateIncident,
    handleDeleteIncident,
    isCreating: createIncident.isPending,
  };
}
