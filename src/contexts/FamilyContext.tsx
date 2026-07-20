import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { auth, db } from "../lib/firebase";
import {
  fetchFamilyMembers,
  initializeFamilyForUser,
  recoverFamilyAfterRemoval,
  subscribeToFamilyMembers,
} from "../services/family";
import { useAuth } from "./AuthContext";

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: "admin" | "member";
  points: number;
  tasksCompleted: number;
  shoppingCompleted: number;
  contributions: number;
}

interface FamilyContextType {
  familyId: string | null;
  familyName: string;
  members: FamilyMember[];
  loading: boolean;
  initialized: boolean;
  isReady: boolean;
  /** Sinaliza que o usuário foi removido da família e migrado para uma nova. */
  wasRemoved: boolean;
  /** Limpa o aviso de remoção após ser exibido ao usuário. */
  acknowledgeRemoval: () => void;
  /** Suprime a auto-recuperação durante uma saída intencional (excluir conta). */
  beginIntentionalExit: () => void;
  /** Cancela a supressão da auto-recuperação (ex.: falha ao excluir conta). */
  cancelIntentionalExit: () => void;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, initialized: authInitialized } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>("Minha Família");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [wasRemoved, setWasRemoved] = useState(false);
  // Quando true, a auto-recuperação por remoção é suprimida (saída intencional).
  const intentionalExit = useRef(false);

  const acknowledgeRemoval = useCallback(() => setWasRemoved(false), []);
  const beginIntentionalExit = useCallback(() => {
    intentionalExit.current = true;
  }, []);
  const cancelIntentionalExit = useCallback(() => {
    intentionalExit.current = false;
  }, []);

  const fetchMembers = useCallback(async (fId: string) => {
    try {
      const membersList = await fetchFamilyMembers(fId);
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  }, []);

  const refreshFamily = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    const nextFamilyId = userData?.familyId as string | undefined;
    if (!nextFamilyId) return;

    const nextFamilyName = userData?.familyName || "Minha Família";
    setFamilyId(nextFamilyId);
    setFamilyName(nextFamilyName);
    await fetchMembers(nextFamilyId);
  }, [fetchMembers]);

  useEffect(() => {
    if (!authInitialized || !user) {
      if (authInitialized && !user) {
        setFamilyId(null);
        setFamilyName("Minha Família");
        setMembers([]);
        setLoading(false);
        setInitialized(true);
      }
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const result = await initializeFamilyForUser(user);
        setFamilyId(result.familyId);
        setFamilyName(result.familyName);
      } catch (error) {
        console.error("Error initializing family:", error);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    init();
  }, [user, authInitialized, fetchMembers]);

  useEffect(() => {
    if (!familyId) return;

    return subscribeToFamilyMembers(familyId, () => {
      fetchMembers(familyId);
    });
  }, [familyId, fetchMembers]);

  // Detecta quando o próprio usuário é removido da família e o recupera criando
  // uma nova família própria.
  useEffect(() => {
    const uid = user?.uid;
    if (!familyId || !uid) return;

    let recovering = false;
    // Evita falso positivo: só reage a uma remoção após confirmar que o membro
    // existia (o doc pode ainda não ter propagado logo após entrar na família).
    let confirmedMember = false;

    const recover = async () => {
      // Saída intencional (excluir conta) não deve recriar família.
      if (recovering || intentionalExit.current) return;
      recovering = true;

      try {
        const current = auth.currentUser;
        if (!current) return;
        const result = await recoverFamilyAfterRemoval(current);
        setFamilyId(result.familyId);
        setFamilyName(result.familyName);
        await fetchMembers(result.familyId);
        setWasRemoved(true);
      } catch (error) {
        recovering = false;
        console.error("Error recovering from family removal:", error);
      }
    };

    const memberDocRef = doc(db, "families", familyId, "members", uid);
    const unsubscribe = onSnapshot(
      memberDocRef,
      (snap) => {
        if (snap.exists()) {
          confirmedMember = true;
          return;
        }
        // Doc sumiu depois de ter existido → o usuário foi removido.
        if (!confirmedMember) return;
        recover();
      },
      (error: any) => {
        // Ao ser removido, o cliente pode perder a permissão de leitura antes
        // de receber o snapshot de remoção. Tratamos permission-denied como
        // remoção, desde que o membro já tivesse sido confirmado.
        if (error?.code === "permission-denied" && confirmedMember) {
          recover();
          return;
        }
        console.error("Member self snapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [familyId, user?.uid, fetchMembers]);

  const isReady = initialized && !loading && !!familyId;

  return (
    <FamilyContext.Provider
      value={{
        familyId,
        familyName,
        members,
        loading,
        initialized,
        isReady,
        wasRemoved,
        acknowledgeRemoval,
        beginIntentionalExit,
        cancelIntentionalExit,
        refreshFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
