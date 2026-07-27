import Constants from 'expo-constants';
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

function getLocalDebugHost(): string | null {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).manifest2?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (typeof hostUri !== 'string') {
    return null;
  }

  const normalized = hostUri.replace(/^.*?:\/\//, '');
  const [host] = normalized.split(':');
  return host || null;
}

function getDefaultSocketUrl() {
  const host = getLocalDebugHost();
  if (host) {
    return `http://${host}:3333`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3333';
  }

  return 'http://localhost:3333';
}

export async function connectSocket(token?: string | null): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const authToken = token ?? (await resolveSocketToken());
  if (!authToken) {
    throw new Error('Token de autenticação do socket não encontrado');
  }

  const socketUrl = getEnv('EXPO_PUBLIC_API_URL', getDefaultSocketUrl());

  logger.info('[socket] URL', socketUrl);

  socket = io(socketUrl, {
    auth: { token: authToken },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    logger.info('[socket] connected', socket?.id);
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
