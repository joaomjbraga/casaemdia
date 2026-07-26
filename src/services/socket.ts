import { io, type Socket } from 'socket.io-client';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getEnv } from '@/lib/env';
import logger from '@/lib/logger';

let socket: Socket | null = null;

export function connectSocket(token: string | null): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const socketUrl = getEnv('EXPO_PUBLIC_API_URL', 'http://192.168.0.103:3333');

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
