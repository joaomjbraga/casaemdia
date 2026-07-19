import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { migrateOrCreateFamily } from "../lib/family-migration";
import { auth, db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: "admin" | "member";
}

interface FamilyContextType {
  familyId: string | null;
  familyName: string;
  members: FamilyMember[];
  loading: boolean;
  initialized: boolean;
  isReady: boolean;
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

  const fetchMembers = useCallback(async (fId: string) => {
    try {
      const q = query(
        collection(db, "families", fId, "members"),
        orderBy("joinedAt", "asc"),
      );
      const snap = await getDocs(q);
      const membersList: FamilyMember[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        email: d.data().email,
        photoURL: d.data().photoURL,
        role: d.data().role,
      }));
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
        const result = await migrateOrCreateFamily(user);
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

    const membersRef = collection(db, "families", familyId, "members");
    return onSnapshot(
      query(membersRef),
      () => {
        fetchMembers(familyId);
      },
      (error) => {
        console.error("Members snapshot error:", error);
      },
    );
  }, [familyId, fetchMembers]);

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
        refreshFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
