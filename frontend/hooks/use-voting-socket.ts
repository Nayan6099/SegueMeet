import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/api';

export function useVotingSocket(entityType: 'decision' | 'resolution', entityId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityId) return;

    // Use environment variable / configured base URL
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('useVotingSocket: WebSocket skipped because NEXT_PUBLIC_API_URL is not configured.');
      }
      return;
    }

    const socketUrl = baseUrl.replace('/api', '');
    const socket = io(socketUrl);

    const roomName = `${entityType}_${entityId}`;

    socket.on('connect', () => {
      socket.emit('join_room', roomName);
    });

    socket.on('vote_updated', (data) => {
      // Invalidate the query for this entity so the UI refreshes
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
    });

    return () => {
      socket.emit('leave_room', roomName);
      socket.disconnect();
    };
  }, [entityType, entityId, queryClient]);
}
