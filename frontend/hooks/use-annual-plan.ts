import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch annual plans for an organisation and year
export function useGetAnnualPlans(organisationId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["annual-plans", organisationId, year],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/annual-plans`, {
        params: { organisationId, year },
      });
      return res.data.data || res.data || [];
    },
    enabled: !!organisationId,
  });
}

// Create (or get-or-create) an annual plan for the given org and year
export function useCreateAnnualPlan(organisationId: string | undefined, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/annual-plans`, { organisationId, year });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}
