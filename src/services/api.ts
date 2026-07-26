
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getEnv } from '@/lib/env';

const API_BASE = getEnv('EXPO_PUBLIC_API_URL', 'http://192.168.0.103:3333');

import logger from '@/lib/logger';

logger.info('[api] API_BASE', API_BASE);

// In-memory token cache to avoid race conditions with AsyncStorage persistence
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token ?? null;
}

async function resolveToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = await ReactNativeAsyncStorage.getItem('token');
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

async function request(path: string, options: RequestInit = {}) {
  const token = await resolveToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      setAuthToken(null);
    } catch {}
    await ReactNativeAsyncStorage.removeItem('token');
    throw new Error('Sessão expirada');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(async () => {
      const text = await response.text().catch(() => 'Erro desconhecido');
      return { message: text };
    });
    const errorMessage = errorBody?.message ?? 'Erro na requisição';
    logger.error('[api] request failed', {
      path,
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`API ${response.status}: ${errorMessage}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  auth: {
    authenticate: (idToken: string) =>
      request('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    me: () => request('/api/auth/me'),
  },
  family: {
    create: (name: string) =>
      request('/api/families', {
        method: 'POST',
        body: JSON.stringify({ familyName: name }),
      }),
    get: () => request('/api/families'),
    addMember: (familyId: string, data: { userId?: string; email: string; name: string; familyRelation?: string | null }) =>
      request(`/api/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeMember: (familyId: string, memberId: string) =>
      request(`/api/families/${familyId}/members/${memberId}`, { method: 'DELETE' }),
    updateMemberRole: (familyId: string, memberId: string, role: string) =>
      request(`/api/families/${familyId}/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    updateMemberRelation: (familyId: string, memberId: string, familyRelation: string | null) =>
      request(`/api/families/${familyId}/members/${memberId}/relation`, {
        method: 'PATCH',
        body: JSON.stringify({ familyRelation }),
      }),
    getMembers: (familyId: string) =>
      request(`/api/families/${familyId}/members`),
  },
  tasks: {
    list: (familyId: string) => request(`/api/tasks?familyId=${familyId}`),
    create: (familyId: string, data: { title: string; assigneeId: string; assigneeName?: string }) =>
      request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...data, familyId }),
      }),
    toggle: (familyId: string, taskId: string) =>
      request(`/api/tasks/${taskId}/status?familyId=${familyId}`, { method: 'PATCH' }),
    delete: (familyId: string, taskId: string) =>
      request(`/api/tasks/${taskId}?familyId=${familyId}`, { method: 'DELETE' }),
    deleteAll: (familyId: string) =>
      request(`/api/tasks?familyId=${familyId}`, { method: 'DELETE' }),
  },
  shopping: {
    list: (familyId: string) => request(`/api/shopping?familyId=${familyId}`),
    create: (familyId: string, data: { name: string; quantity?: string; assigneeId?: string; assigneeName?: string }) =>
      request('/api/shopping', {
        method: 'POST',
        body: JSON.stringify({ ...data, familyId }),
      }),
    updateQuantity: (familyId: string, itemId: string, quantity: string) =>
      request(`/api/shopping/${itemId}/quantity?familyId=${familyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    toggle: (familyId: string, itemId: string) =>
      request(`/api/shopping/${itemId}/status?familyId=${familyId}`, { method: 'PATCH' }),
    delete: (familyId: string, itemId: string) =>
      request(`/api/shopping/${itemId}?familyId=${familyId}`, { method: 'DELETE' }),
    deleteCompleted: (familyId: string) =>
      request(`/api/shopping/completed?familyId=${familyId}`, { method: 'DELETE' }),
  },
  chat: {
    list: (familyId: string) => request(`/api/chat?familyId=${familyId}`),
    create: (familyId: string, data: { text: string; attachment?: any }) =>
      request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ ...data, familyId }),
      }),
    delete: (familyId: string, messageId: string) =>
      request(`/api/chat/${messageId}?familyId=${familyId}`, { method: 'DELETE' }),
    clear: (familyId: string) =>
      request(`/api/chat?familyId=${familyId}`, { method: 'DELETE' }),
  },
  invitations: {
    listPending: () => request('/api/invitations/pending'),
    listSent: (familyId: string) => request(`/api/invitations/sent/${familyId}`),
    create: (data: { familyId: string; toEmail: string }) =>
      request('/api/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    accept: (invitationId: string, currentFamilyId?: string) =>
      request(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ invitationId, currentFamilyId }),
      }),
    decline: (invitationId: string) =>
      request(`/api/invitations/${invitationId}/decline`, { method: 'POST' }),
  },
  upload: {
    image: async (uri: string) => {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);

      const token = await resolveToken();
      const response = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload falhou');
      }

      return response.json();
    },
  },
};

export default api;
