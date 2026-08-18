import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch the agenda for a specific meeting
export function useGetAgenda(meetingId: string | undefined) {
  return useQuery({
    queryKey: ["agenda", meetingId],
    queryFn: async () => {
      const res = await api.get(`/meetings/${meetingId}/agenda`);
      return res.data;
    },
    enabled: !!meetingId,
  });
}

// Create an agenda section
export function useCreateAgendaSection(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; position?: number }) => {
      const res = await api.post(`/meetings/${meetingId}/agenda/sections`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}

// Update an agenda section
export function useUpdateAgendaSection(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, ...data }: { sectionId: string; title?: string; position?: number }) => {
      const res = await api.patch(`/agenda/sections/${sectionId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}

// Delete an agenda section
export function useDeleteAgendaSection(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await api.delete(`/agenda/sections/${sectionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}

// Create an agenda item
export function useCreateAgendaItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: { title: string; purpose?: string; presenter?: string; durationMinutes?: number; position?: number } }) => {
      const res = await api.post(`/agenda/sections/${sectionId}/items`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}

// Update an agenda item
export function useUpdateAgendaItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: string; title?: string; purpose?: string; presenter?: string; durationMinutes?: number; position?: number }) => {
      const res = await api.patch(`/agenda/items/${itemId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}

// Delete an agenda item
export function useDeleteAgendaItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.delete(`/agenda/items/${itemId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
    },
  });
}
