import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUpdateActionItem, useDeleteActionItem } from "./use-minutes";

// Fetch organisation-wide action items
export function useGetOrganisationActions(organisationId: string | undefined, options?: { status?: string; assigneeId?: string; skip?: number; take?: number }) {
  return useQuery({
    queryKey: ["global-actions", organisationId, options],
    queryFn: async () => {
      if (!organisationId) return { data: [], total: 0 };
      
      const params: Record<string, string> = { organisationId };
      if (options?.status) params.status = options.status;
      if (options?.assigneeId) params.assigneeId = options.assigneeId;
      if (options?.skip !== undefined) params.skip = options.skip.toString();
      if (options?.take !== undefined) params.take = options.take.toString();

      const res = await api.get(`/minutes/actions`, { params });
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Re-export mutations from use-minutes for convenience
export { useUpdateActionItem, useDeleteActionItem };
