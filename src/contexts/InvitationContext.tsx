import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../lib/firebase";
import {
  acceptFamilyInvitation,
  declineFamilyInvitation,
  fetchPendingInvitations as fetchPendingInvitationsService,
  markInvitationAsExpired,
  sendFamilyInvitation,
} from "../services/family";
import { useAuth } from "./AuthContext";
import { useFamily } from "./FamilyContext";

export interface Invitation {
  id: string;
  familyId: string;
  familyName: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: any;
}

interface InvitationContextType {
  pendingInvitations: Invitation[];
  loading: boolean;
  sendInvitation: (email: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
}

const InvitationContext = createContext<InvitationContextType | undefined>(
  undefined,
);

export const useInvitations = () => {
  const context = useContext(InvitationContext);
  if (!context) {
    throw new Error("useInvitations must be used within an InvitationProvider");
  }
  return context;
};

export const InvitationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { familyId, familyName, members, refreshFamily } = useFamily();
  const { user } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const fetchPendingInvitations = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid || !email) return;

    try {
      const { invitations, expiredIds } =
        await fetchPendingInvitationsService(email);
      setPendingInvitations(invitations as Invitation[]);

      for (const id of expiredIds) {
        markInvitationAsExpired(id).catch(() => {});
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid || !email) return;

    fetchPendingInvitations();

    const q = query(
      collection(db, "invitations"),
      where("toEmail", "==", email),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(
      q,
      () => {
        fetchPendingInvitations();
      },
      (error) => {
        console.error("Invitations snapshot error:", error);
      },
    );

    return unsubscribe;
  }, [fetchPendingInvitations, user?.uid]);

  useEffect(() => {
    if (!user) {
      setPendingInvitations([]);
    }
  }, [user]);

  const sendInvitation = useCallback(
    async (email: string) => {
      if (!familyId || !familyName) throw new Error("Família não carregada");
      if (!auth.currentUser) throw new Error("Usuário não autenticado");

      setLoading(true);
      try {
        await sendFamilyInvitation(
          familyId,
          familyName,
          auth.currentUser,
          email,
          members,
        );
      } finally {
        setLoading(false);
      }
    },
    [familyId, familyName, members],
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      const uid = auth.currentUser?.uid;
      const user = auth.currentUser;
      if (!uid || !user) throw new Error("Usuario nao autenticado");

      setLoading(true);
      try {
        await acceptFamilyInvitation(
          invitationId,
          user,
          familyId,
          refreshFamily,
        );
      } finally {
        setLoading(false);
      }
    },
    [refreshFamily, familyId],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      setLoading(true);
      try {
        await declineFamilyInvitation(invitationId);
        await fetchPendingInvitations();
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingInvitations],
  );

  return (
    <InvitationContext.Provider
      value={{
        pendingInvitations,
        loading,
        sendInvitation,
        acceptInvitation,
        declineInvitation,
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
};
