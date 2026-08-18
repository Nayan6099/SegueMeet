import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Perform a global search across meetings, documents, and people
export function useSearch(query: string, organisationId: string | undefined) {
  return useQuery({
    queryKey: ["search", organisationId, query],
    queryFn: async () => {
      if (!organisationId || !query.trim()) {
        return { meetings: [], documents: [], people: [] };
      }
      const res = await api.get(`/search`, {
        params: {
          organisationId,
          q: query.trim()
        }
      });
      return res.data;
    },
    enabled: !!organisationId && !!query.trim(),
  });
}
