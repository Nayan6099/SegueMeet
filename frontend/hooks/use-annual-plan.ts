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
      return res.data;
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

// Delete an annual plan
export function useDeleteAnnualPlan(organisationId: string | undefined, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.delete(`/annual-plans/${planId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}

// Create a new item for an annual plan
export function useCreatePlanItem(organisationId: string | undefined, year: number, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; month: number; status?: string }) => {
      const res = await api.post(`/annual-plans/${planId}/items`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}

// Bulk create items for an annual plan
export function useCreatePlanItemsBulk(organisationId: string | undefined, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, items }: { planId: string, items: Array<{ title: string; description?: string; month: number; status?: string }> }) => {
      const res = await api.post(`/annual-plans/${planId}/items/bulk`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}

// Update a plan item
export function useUpdatePlanItem(organisationId: string | undefined, year: number, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, patch }: { itemId: string; patch: any }) => {
      const res = await api.patch(`/annual-plans/${planId}/items/${itemId}`, patch);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}

// Delete a plan item
export function useDeletePlanItem(organisationId: string | undefined, year: number, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.delete(`/annual-plans/${planId}/items/${itemId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", organisationId, year] });
    },
  });
}
