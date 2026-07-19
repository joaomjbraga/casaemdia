import { auth } from "@/lib/firebase";
import {
  configureGoogleSignIn,
  signInWithGoogle as googleSignIn,
} from "@/lib/google-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, deleteUser, onAuthStateChanged } from "firebase/auth";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

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
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEYS = {
  SYNC_QUEUE: "@sync_queue",
  USER_PREFS: "@user_preferences",
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CACHE_KEYS.SYNC_QUEUE, CACHE_KEYS.USER_PREFS]);
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith("@cache_"));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitialized(true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      const firebaseUser = await googleSignIn();
      setUser(firebaseUser);
      return {
        data: { user: firebaseUser },
        error: null,
        success: true,
      };
    } catch (error: any) {
      let message = "Erro ao entrar com Google.";

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
        console.warn("Google signOut error (non-blocking):", e);
      }
      await auth.signOut();
      await clearUserData();
      setUser(null);
    } catch (error) {
      console.error("SignOut error:", error);
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
    await deleteUser(current);
    await clearUserData();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
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
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos.";
    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";
    case "auth/operation-not-allowed":
      return "Login com Google não habilitado. Verifique no Firebase Console.";
    case "auth/credential-already-in-use":
      return "Esta conta já está associada a outro método de login.";
    case "auth/account-exists-with-different-credential":
      return "Já existe uma conta com este e-mail usando outro método de login.";
    default:
      return "Ocorreu um erro. Tente novamente.";
  }
}
