import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch minutes for a specific meeting
export function useGetMinutes(meetingId: string | undefined) {
  return useQuery({
    queryKey: ["minutes", meetingId],
    queryFn: async () => {
      try {
        const res = await api.get(`/meetings/${meetingId}/minutes`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Auto-initialize if missing
          const res = await api.post(`/meetings/${meetingId}/minutes`, {
            status: "DRAFT",
            content: "[]",
          });
          return res.data;
        }
        throw err;
      }
    },
    enabled: !!meetingId,
  });
}

// Update minutes
export function useUpdateMinutes(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ minutesId, status, content }: { minutesId: string; status?: string; content?: string }) => {
      const res = await api.patch(`/minutes/${minutesId}`, { status, content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
    },
  });
}

// Create action item
export function useCreateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minutesId: string) => {
      const res = await api.post(`/minutes/${minutesId}/action-items`, {
        description: "New action item",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      // Invalidate global actions to keep dashboard in sync
      queryClient.invalidateQueries({ queryKey: ["global-actions"] });
    },
  });
}

// Update action item
export function useUpdateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const res = await api.patch(`/action-items/${id}`, patch);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["global-actions"] });
    },
  });
}

// Delete action item
export function useDeleteActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/action-items/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["global-actions"] });
    },
  });
}
