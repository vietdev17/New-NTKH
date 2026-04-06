'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/use-auth-store';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
      socketRef.current = getSocket();
    }
    return () => { disconnectSocket(); };
  }, [accessToken]);

  return socketRef.current;
}

export function useSocketEvent(event: string, handler: (...args: any[]) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}

// Join a socket room (e.g. 'room:order:abc123') — auto-leave on unmount
export function useSocketRoom(room: string | null) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join_room', room);
    return () => { socket.emit('leave_room', room); };
  }, [socket, room]);
}
