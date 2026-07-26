import { io, type Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getEnv } from '@/lib/env';
import logger from '@/lib/logger';
import { storageGet } from '@/lib/storage';

let socket: Socket | null = null;

export async function resolveSocketToken(): Promise<string | null> {
  try {
    const stored = await storageGet('token');
    return stored;
  } catch {
    return null;
  }
}

export function connectSocket(token: string | null): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const socketUrl = getEnv('EXPO_PUBLIC_API_URL', Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333');

  logger.info('[socket] URL', socketUrl);

  socket = io(socketUrl, {
    auth: { token: token ?? '' },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export { socket };
