import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../lib/firebase";
import { useFamily } from "./FamilyContext";
import { useAuth } from "./AuthContext";
import { sendNotificationToEmail } from "../lib/onesignal";

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
      const q = query(
        collection(db, "invitations"),
        where("toEmail", "==", email),
        where("status", "==", "pending"),
      );
      const snap = await getDocs(q);
      const now = Date.now();
      const expiredIds: string[] = [];
      const invitations: Invitation[] = snap.docs
        .map((d) => ({
          id: d.id,
          familyId: d.data().familyId,
          familyName: d.data().familyName,
          fromUserId: d.data().fromUserId,
          fromUserName: d.data().fromUserName,
          toEmail: d.data().toEmail,
          status: d.data().status,
          createdAt: d.data().createdAt,
        }))
        .filter((inv) => {
          const docData = snap.docs.find((d) => d.id === inv.id);
          const expiresAt = docData?.data().expiresAt;
          if (expiresAt && expiresAt.toMillis() < now) {
            expiredIds.push(inv.id);
            return false;
          }
          return true;
        });
      setPendingInvitations(invitations);

      for (const id of expiredIds) {
        const docRef = doc(db, "invitations", id);
        updateDoc(docRef, { status: "expired" }).catch(() => {});
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
        const existingQ = query(
          collection(db, "invitations"),
          where("familyId", "==", familyId),
          where("toEmail", "==", email.trim().toLowerCase()),
          where("fromUserId", "==", auth.currentUser.uid),
          where("status", "==", "pending"),
        );
        const existingSnap = await getDocs(existingQ);
        if (!existingSnap.empty) {
          throw new Error("Convite já enviado para este email");
        }

        const alreadyMember = members.some(
          (m) => m.email === email.trim().toLowerCase(),
        );
        if (alreadyMember) {
          throw new Error("Este email já é membro da família");
        }

        await addDoc(collection(db, "invitations"), {
          familyId,
          familyName,
          fromUserId: auth.currentUser.uid,
          fromUserName: auth.currentUser.displayName || "Administrador",
          toEmail: email.trim().toLowerCase(),
          status: "pending",
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        });

        const senderName = auth.currentUser.displayName || "Alguem";
        await sendNotificationToEmail({
          email: email.trim().toLowerCase(),
          title: "Convite de Familia",
          body: `${senderName} te convidou para a familia "${familyName}". Abra o app para aceitar.`,
          data: { type: "invitation" },
        });
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
        const invRef = doc(db, "invitations", invitationId);
        const invSnap = await getDoc(invRef);
        if (!invSnap.exists()) throw new Error("Convite nao encontrado");

        const invData = invSnap.data();
        if (invData.status !== "pending")
          throw new Error("Este convite nao esta mais disponivel");
        if (invData.toEmail?.toLowerCase() !== user.email?.toLowerCase()) {
          throw new Error("Este convite nao pertence ao usuario atual");
        }

        const targetFamilyId = invData.familyId;
        const targetFamilyName = invData.familyName || "Minha Familia";

        const currentFamilyId = familyId;

        const memberRef = doc(db, "families", targetFamilyId, "members", uid);
        const userRef = doc(db, "users", uid);
        const batch = writeBatch(db);

        batch.set(memberRef, {
          name: user.displayName || "Membro",
          email: user.email || "",
          photoURL: user.photoURL || null,
          role: "member",
          invitationId,
          joinedAt: serverTimestamp(),
        });

        batch.set(
          userRef,
          {
            familyId: targetFamilyId,
            familyName: targetFamilyName,
            migratedAt: serverTimestamp(),
          },
          { merge: true },
        );

        if (currentFamilyId && currentFamilyId !== targetFamilyId) {
          const oldMemberRef = doc(db, "families", currentFamilyId, "members", uid);
          batch.delete(oldMemberRef);
        }

        batch.update(invRef, { status: "accepted" });
        await batch.commit();

        await refreshFamily();
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
        const invRef = doc(db, "invitations", invitationId);
        await updateDoc(invRef, { status: "declined" });
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
