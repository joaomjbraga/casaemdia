import { User } from '@/types/models';
import { storageGet, storageGetAllKeys, storageMultiRemove, storageRemove, storageSet } from '@/lib/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api, setAuthToken } from '@/services/api';
import { signInWithGoogle as googleSignIn } from '@/lib/google-auth';
import { disconnectSocket } from '@/services/socket';

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

interface AuthError {
  message: string;
  status?: number;
}

interface AuthResult {
  data?: {
    user: User;
  };
  error: AuthError | null;
  success: boolean;
}

interface AuthContextType {
  user: User | null;
  backendUserId: string | null;
  loading: boolean;
  initialized: boolean;
  isTokenReady: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

const clearUserData = async (): Promise<void> => {
  try {
    const keys = await storageGetAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith('@cache_'));
    if (cacheKeys.length > 0) {
      await storageMultiRemove(cacheKeys);
    }
  } catch (error) {
    logger.error('Error clearing user data:', error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [backendUserId, setBackendUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await storageGet('token');
        if (!isMounted) return;

        if (storedToken) {
          setAuthToken(storedToken);
          setBackendUserId(decodeJwtSub(storedToken));
          setIsTokenReady(true);

          try {
            const me = await api.auth.me();
            setUser({ uid: me.user.id, email: me.user.email, displayName: me.user.name, photoURL: me.user.photoURL });
          } catch {
            setIsTokenReady(false);
            setBackendUserId(null);
            setAuthToken(null);
            await storageRemove('token');
            setUser(null);
          }
        }
      } catch {
        if (!isMounted) return;
        setIsTokenReady(false);
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      const { user: googleUser, idToken } = await googleSignIn();

      try {
        const authResponse = await api.auth.authenticate(idToken);
        logger.info('[AuthProvider] Backend auth response', { hasToken: !!authResponse?.token, tokenPrefix: authResponse?.token?.slice(0, 20) });
        if (!authResponse?.token) {
          throw new Error('Token não recebido do backend');
        }

        await storageSet('token', authResponse.token);
        const stored = await storageGet('token');
        logger.info('[AuthProvider] Token stored length', { length: stored?.length ?? 0, storedPrefix: stored?.slice(0, 20) });

        setAuthToken(authResponse.token);
        setBackendUserId(decodeJwtSub(authResponse.token));
        setIsTokenReady(true);
        setUser(googleUser as unknown as User);

        return {
          data: { user: googleUser as unknown as User },
          error: null,
          success: true,
        };
      } catch (error: any) {
        setIsTokenReady(false);
        logger.error('[AuthProvider] Backend auth error raw', {
          message: error?.message,
          status: error?.status,
          body: error?.body,
          raw: error,
        });

        return {
          error: { message: error?.message || 'Falha ao autenticar no backend' },
          success: false,
        };
      }
    } catch (error: any) {
      setIsTokenReady(false);
      let message = 'Erro ao entrar com Google.';

      if (error.code) {
        message = translateGoogleError(error.code);
      } else if (error.message) {
        message = error.message;
      }

      return {
        error: { message },
        success: false,
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      try {
        await GoogleSignin.signOut().catch(() => {});
      } catch {}
      disconnectSocket();
      setAuthToken(null);
      setBackendUserId(null);
      setIsTokenReady(false);
      await storageRemove('token');
      await clearUserData();
      setUser(null);
    } catch (error) {
      logger.error('SignOut error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    const currentUserId = backendUserId;
    if (!currentUserId) return;
    try {
      setLoading(true);
      try {
        await api.auth.deleteAccount();
      } catch (error: any) {
        logger.error('[AuthProvider] deleteAccount API error', { message: error?.message, raw: error });
        throw new Error(error?.message || 'Falha ao excluir conta no backend.');
      }
      setAuthToken(null);
      setBackendUserId(null);
      setIsTokenReady(false);
      await storageRemove('token');
      await clearUserData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        backendUserId,
        loading,
        initialized,
        isTokenReady,
        signInWithGoogle,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function translateGoogleError(code: string): string {
  switch (code) {
    case 'IN_PROGRESS':
      return 'Operação de login já em andamento.';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play Services não disponíveis.';
    case 'SIGN_IN_CANCELLED':
      return 'Login cancelado.';
    case 'NETWORK_ERROR':
      return 'Erro de conexão. Verifique sua internet.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}