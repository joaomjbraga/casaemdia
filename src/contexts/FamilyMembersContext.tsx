import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { db, auth } from "../lib/firebase";
import { sendNotificationToEmail } from "../lib/onesignal";
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
      const q = query(
        collection(db, "families", familyId, "members"),
        orderBy("name", "asc"),
      );
      const snapshot = await getDocs(q);
       const members: FamilyMember[] = snapshot.docs
         .map((d) => ({
           id: d.id,
           name: d.data().name,
           email: d.data().email ?? "",
           photoURL: d.data().photoURL ?? null,
           role: (d.data().role ?? "member") as "admin" | "member",
           points: d.data().points ?? 0,
           tasksCompleted: d.data().tasksCompleted ?? 0,
           shoppingCompleted: d.data().shoppingCompleted ?? 0,
           contributions: d.data().contributions ?? 0,
         }));
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

      const existingQuery = query(
        collection(db, "families", familyId, "members"),
        where("name", "==", name.trim()),
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        throw new Error("Já existe um membro com esse nome");
      }

      try {
        setLoading(true);
        await addDoc(collection(db, "families", familyId, "members"), {
          name: name.trim(),
          email: "",
          photoURL: null,
          role: "member",
          joinedAt: new Date(),
        });
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

        const tasksSnapshot = await getDocs(
          collection(db, "families", familyId, "tasks"),
        );
        const memberTasks = tasksSnapshot.docs.filter(
          (d) => d.data().assignee === member.name,
        );
        if (memberTasks.length > 0) {
          throw new Error(
            "Não é possível remover este membro, pois ele tem tarefas atribuídas.",
          );
        }

        await deleteDoc(doc(db, "families", familyId, "members", id));

        // Notifica o membro removido (best-effort, não bloqueia a remoção).
        if (member.email) {
          sendNotificationToEmail({
            email: member.email,
            title: "Você saiu da família",
            body: `Você foi removido da família "${familyName}".`,
            data: { type: "member_removed" },
          }).catch(() => {});
        }

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
