import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../lib/firebase";
import {
  addFamilyMemberToStore,
  deleteFamilyMemberFromStore,
  fetchFamilyMembersFromStore,
} from "../services/family-members";
import { useFamily } from "./FamilyContext";

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

interface FamilyMembersContextType {
  familyMembers: FamilyMember[];
  fetchFamilyMembers: () => Promise<void>;
  addFamilyMember: (name: string) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  loading: boolean;
}

const FamilyMembersContext = createContext<
  FamilyMembersContextType | undefined
>(undefined);

export const FamilyMembersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { familyId, familyName } = useFamily();

  const fetchFamilyMembers = useCallback(async () => {
    if (!familyId || !auth.currentUser) return;
    try {
      setLoading(true);
      const members = await fetchFamilyMembersFromStore(familyId);
      setFamilyMembers(members);
    } catch (error: any) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  const addFamilyMember = useCallback(
    async (name: string) => {
      if (!familyId) throw new Error("Família não carregada");
      if (!name.trim()) throw new Error("Nome do membro é obrigatório");

      try {
        setLoading(true);
        await addFamilyMemberToStore(familyId, name);
        await fetchFamilyMembers();
      } catch (error: any) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [familyId, fetchFamilyMembers],
  );

  const deleteFamilyMember = useCallback(
    async (id: string) => {
      if (!familyId) throw new Error("Família não carregada");

      try {
        setLoading(true);

        const member = familyMembers.find((m) => m.id === id);
        if (!member) throw new Error("Membro não encontrado.");

        await deleteFamilyMemberFromStore({
          familyId,
          memberId: id,
          memberName: member.name,
          memberEmail: member.email,
          familyName,
        });

        await fetchFamilyMembers();
      } catch (error: any) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [familyId, familyName, familyMembers, fetchFamilyMembers],
  );

  useEffect(() => {
    if (!familyId) return;
    fetchFamilyMembers();
  }, [familyId, fetchFamilyMembers]);

  return (
    <FamilyMembersContext.Provider
      value={{
        familyMembers,
        fetchFamilyMembers,
        addFamilyMember,
        deleteFamilyMember,
        loading,
      }}
    >
      {children}
    </FamilyMembersContext.Provider>
  );
};

export const useFamilyMembers = () => {
  const context = useContext(FamilyMembersContext);
  if (!context) {
    throw new Error(
      "useFamilyMembers must be used within a FamilyMembersProvider",
    );
  }
  return context;
};
