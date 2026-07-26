import { auth } from '@/lib/firebase';
import { configureGoogleSignIn, signInWithGoogle as googleSignIn } from '@/lib/google-auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { User, deleteUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api, setAuthToken } from '@/services/api';

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
    const keys = await ReactNativeAsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith('@cache_'));
    if (cacheKeys.length > 0) {
      await ReactNativeAsyncStorage.multiRemove(cacheKeys);
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
    configureGoogleSignIn();

    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await ReactNativeAsyncStorage.getItem('token');
        if (!isMounted) return;

        if (storedToken) {
          setAuthToken(storedToken);
          setBackendUserId(decodeJwtSub(storedToken));
          setIsTokenReady(true);
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

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return;
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      const { user: firebaseUser, idToken } = await googleSignIn();

      try {
        const authResponse = await api.auth.authenticate(idToken);
        logger.info('[AuthProvider] Backend auth response', { hasToken: !!authResponse?.token, tokenPrefix: authResponse?.token?.slice(0, 20) });
        if (!authResponse?.token) {
          throw new Error('Token não recebido do backend');
        }

        await ReactNativeAsyncStorage.setItem('token', authResponse.token);
        const stored = await ReactNativeAsyncStorage.getItem('token');
        logger.info('[AuthProvider] Token stored length', { length: stored?.length ?? 0, storedPrefix: stored?.slice(0, 20) });

        // keep token in memory to avoid AsyncStorage race
        setAuthToken(authResponse.token);
        setBackendUserId(decodeJwtSub(authResponse.token));
        setIsTokenReady(true);
        setUser(firebaseUser);

        return {
          data: { user: firebaseUser },
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
        message = translateFirebaseError(error.code);
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
        await GoogleSignin.signOut();
      } catch (e) {
        logger.warn('Google signOut error (non-blocking):', e);
      }
      await auth.signOut();
      try {
        setAuthToken(null);
      } catch {}
      setBackendUserId(null);
      setIsTokenReady(false);
      await ReactNativeAsyncStorage.removeItem('token');
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
    const current = auth.currentUser;
    if (!current) return;
    try {
      await GoogleSignin.signOut().catch(() => {});
    } catch {
      // non-blocking
    }
    try {
      await deleteUser(current);
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        throw new Error('É necessário fazer login novamente antes de excluir a conta.');
      }
      throw error;
    }
    try {
      setAuthToken(null);
    } catch {}
    setBackendUserId(null);
    await ReactNativeAsyncStorage.removeItem('token');
    await clearUserData();
    setUser(null);
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

function translateFirebaseError(code: string): string {
  switch (code) {
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet.';
    case 'auth/operation-not-allowed':
      return 'Login com Google não habilitado. Verifique no Firebase Console.';
    case 'auth/credential-already-in-use':
      return 'Esta conta já está associada a outro método de login.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este e-mail usando outro método de login.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}
