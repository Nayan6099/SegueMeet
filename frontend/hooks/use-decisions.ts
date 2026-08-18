import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch decisions for an organisation
export function useGetDecisions(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/decisions`, {
        params: { organisationId },
      });
      return res.data.data || [];
    },
    enabled: !!organisationId,
  });
}
