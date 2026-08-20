import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Rename Board/Organisation
export function useRenameBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, name }: { boardId: string; name: string }) => {
      const response = await api.patch(`/organisations/${boardId}`, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
    },
  });
}

// Delete Board/Organisation
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const response = await api.delete(`/organisations/${boardId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// Rename Committee
export function useRenameCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ committeeId, name }: { committeeId: string; name: string }) => {
      const response = await api.patch(`/committees/${committeeId}`, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
    },
  });
}

// Delete Committee
export function useDeleteCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (committeeId: string) => {
      const response = await api.delete(`/committees/${committeeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
    },
  });
}
