import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch organisation settings
export function useGetOrganisationSettings(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["organisation", organisationId],
    queryFn: async () => {
      if (!organisationId) return null;
      const res = await api.get(`/organisations/${organisationId}`);
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Update organisation settings
export function useUpdateOrganisationSettings(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; settings?: any }) => {
      const res = await api.patch(`/organisations/${organisationId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisation", organisationId] });
    },
  });
}

// Fetch audit logs
export function useGetAuditLogs(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["audit-logs", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/organisations/${organisationId}/audit-logs`);
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Fetch active sessions
export function useGetSessions() {
  return useQuery({
    queryKey: ["auth-sessions"],
    queryFn: async () => {
      const res = await api.get("/auth/sessions");
      return res.data;
    },
  });
}

// Revoke a single session
export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post(`/auth/sessions/${sessionId}/revoke`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
  });
}

// Revoke all other sessions
export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/auth/sessions/revoke-others");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
  });
}

