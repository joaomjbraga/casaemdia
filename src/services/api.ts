
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getEnv } from '@/lib/env';
import { storageGet, storageRemove, storageSet } from '@/lib/storage';

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

function getDefaultApiBase() {
  const host = getLocalDebugHost();
  if (host) {
    return `http://${host}:3333`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3333';
  }

  return 'http://localhost:3333';
}

const API_BASE = getEnv('EXPO_PUBLIC_API_URL', getDefaultApiBase());

import logger from '@/lib/logger';

logger.info('[api] API_BASE', API_BASE);

// In-memory token cache to avoid race conditions with AsyncStorage persistence
let inMemoryToken: string | null = null;
const inFlightRequests = new Map<string, Promise<any>>();

export function setAuthToken(token: string | null) {
  inMemoryToken = token ?? null;
}

async function resolveToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = await storageGet('token');
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

async function request<T = any>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = await resolveToken();
  const bodyKey = typeof options.body === 'string' ? options.body : '';
  const requestKey = `${(options.method || 'GET').toUpperCase()}:${path}:${bodyKey}`;

  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const executeRequest = async () => {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 401) {
          const errorBody = await response.json().catch(async () => {
            const text = await response.text().catch(() => null);
            return text ? { message: text } : null;
          });
          const isAuthEndpoint = path === '/api/auth';
          if (isAuthEndpoint) {
            throw new Error(errorBody?.message ?? 'Falha na autenticação');
          }
          try {
            setAuthToken(null);
          } catch {}
          await storageRemove('token');
          throw new Error(errorBody?.message ?? 'Sessão expirada');
        }

        if (response.status === 429) {
          logger.warn('[api] rate limited', { path, status: response.status, statusText: response.statusText });
          throw new Error('API 429: Muitas requisições. Tente novamente mais tarde.');
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
      } catch (error: any) {
        lastError = error;
        const shouldRetry = attempt < retries && (error.name === 'AbortError' || error.message?.includes('Network request failed'));
        if (shouldRetry) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    throw lastError ?? new Error('Erro na requisição');
  };

  const requestPromise = executeRequest();
  inFlightRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(requestKey);
  }
}

export const api = {
  auth: {
    authenticate: (idToken: string) =>
      request('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    me: () => request('/api/auth/me'),
    deleteAccount: () => request('/api/auth/me', { method: 'DELETE' }),
  },
  family: {
    create: (name: string) =>
      request('/api/families', {
        method: 'POST',
        body: JSON.stringify({ familyName: name }),
      }),
    get: () => request('/api/families'),
    getAll: () => request('/api/families/all'),
    addMember: (familyId: string, data: { userId?: string; email: string; name: string }) =>
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
    updateName: (familyId: string, name: string) =>
      request<{ family: any }>(`/api/families/${familyId}/name`, {
        method: 'PATCH',
        body: JSON.stringify({ familyName: name }),
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
  joinRequests: {
    send: (familyId: string) =>
      request('/api/join-requests', {
        method: 'POST',
        body: JSON.stringify({ familyId }),
      }),
    listPendingByFamily: (familyId: string) =>
      request(`/api/join-requests/family/${familyId}`),
    listPendingByUser: () =>
      request('/api/join-requests/pending'),
    accept: (requestId: string) =>
      request(`/api/join-requests/${requestId}/accept`, { method: 'POST' }),
    decline: (requestId: string) =>
      request(`/api/join-requests/${requestId}/decline`, { method: 'POST' }),
    cancel: (requestId: string) =>
      request(`/api/join-requests/${requestId}/cancel`, { method: 'POST' }),
  },
  bills: {
    list: (familyId: string) => request(`/api/bills?familyId=${familyId}`),
    get: (familyId: string, billId: string) =>
      request(`/api/bills/${billId}?familyId=${familyId}`),
    create: (familyId: string, data: {
      title: string;
      description?: string | null;
      amount: number;
      dueDate: string;
      type: 'recurring' | 'unique';
      category: string;
      totalInstallments: number;
      reminderDays: number[];
    }) =>
      request('/api/bills', {
        method: 'POST',
        body: JSON.stringify({ ...data, familyId }),
      }),
    update: (familyId: string, billId: string, data: Partial<{
      title: string;
      description: string | null;
      amount: number;
      dueDate: string;
      category: string;
      reminderDays: number[];
    }>) =>
      request(`/api/bills/${billId}?familyId=${familyId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (familyId: string, billId: string) =>
      request(`/api/bills/${billId}?familyId=${familyId}`, { method: 'DELETE' }),
    listInstallments: (familyId: string) =>
      request(`/api/bills/installments?familyId=${familyId}`),
    payInstallment: (familyId: string, billId: string, installmentId: string) =>
      request(`/api/bills/${billId}/installments/${installmentId}/pay?familyId=${familyId}`, { method: 'POST' }),
    payBill: (familyId: string, billId: string) =>
      request(`/api/bills/${billId}/pay?familyId=${familyId}`, { method: 'POST' }),
    getUpcoming: (familyId: string, limit?: number) =>
      request(`/api/bills/upcoming?familyId=${familyId}&limit=${limit ?? 10}`),
    getMonthSummary: (familyId: string, month?: number, year?: number) => {
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year ?? now.getFullYear();
      return request(`/api/bills/month-summary?familyId=${familyId}&month=${m}&year=${y}`);
    },
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
