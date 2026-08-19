import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch committees for an organisation
export function useGetCommittees(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["committees", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/committees`, {
        params: { organisationId },
      });
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Create a new committee
export function useCreateCommittee(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description: string; organisationId: string }) => {
      const res = await api.post(`/committees`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}

// Update a committee
export function useUpdateCommittee(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      const res = await api.patch(`/committees/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}

// Delete a committee
export function useDeleteCommittee(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/committees/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}

// Add a member to a committee
export function useAddCommitteeMember(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ committeeId, userId, role }: { committeeId: string; userId: string; role: string }) => {
      const res = await api.post(`/committees/${committeeId}/members`, { userId, role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}

// Update a member's role in a committee
export function useUpdateCommitteeMemberRole(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ committeeId, userId, role }: { committeeId: string; userId: string; role: string }) => {
      const res = await api.patch(`/committees/${committeeId}/members/${userId}`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}

// Remove a member from a committee
export function useRemoveCommitteeMember(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ committeeId, userId }: { committeeId: string; userId: string }) => {
      const res = await api.delete(`/committees/${committeeId}/members/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees", organisationId] });
    },
  });
}
