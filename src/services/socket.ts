import { io, type Socket } from 'socket.io-client';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getEnv } from '@/lib/env';
import logger from '@/lib/logger';

let socket: Socket | null = null;

export function connectSocket(token: string | null): Socket {
  if (socket?.connected) {
    return socket;
  }

  const socketUrl = getEnv('EXPO_PUBLIC_API_URL', 'http://192.168.0.103:3333');

  logger.info('[socket] URL', socketUrl);

  // Create socket but don't auto connect if we need to resolve token asynchronously
  socket = io(socketUrl, {
    auth: { token: token ?? '' },
    transports: ['websocket'],
    autoConnect: false,
  });

  // Attach handlers will be able to register before connect is called by callers

  // If no token was provided, try to load stored token and then connect
  (async () => {
    try {
      let resolved: string | null = token;
      if (!resolved) {
        resolved = await ReactNativeAsyncStorage.getItem('token');
      }
      if (resolved) {
        // set auth and connect
        // @ts-ignore - socket.auth is allowed by socket.io client
        socket!.auth = { token: resolved };
      }
    } catch (e) {
      // ignore storage errors
    } finally {
      try {
        socket!.connect();
      } catch {
        // ignore connect errors here; callers can listen for error events
      }
    }
  })();

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
