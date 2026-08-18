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
