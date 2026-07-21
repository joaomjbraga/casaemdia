import type { FamilyMember, Invitation } from "@/types/models";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  createNewFamily,
  migrateOrCreateFamily,
} from "../lib/family-migration";
import { db } from "../lib/firebase";
import { removeUserTags, sendNotificationToEmail } from "../lib/onesignal";



export const fetchFamilyMembers = async (familyId: string) => {
  const q = query(
    collection(db, "families", familyId, "members"),
    orderBy("joinedAt", "asc"),
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    email: d.data().email ?? "",
    photoURL: d.data().photoURL ?? null,
    role: (d.data().role ?? "member") as "admin" | "member",
    points: d.data().points ?? 0,
    tasksCompleted: d.data().tasksCompleted ?? 0,
    shoppingCompleted: d.data().shoppingCompleted ?? 0,
    contributions: d.data().contributions ?? 0,
  })) satisfies FamilyMember[];
};

export const initializeFamilyForUser = async (user: any) => {
  return migrateOrCreateFamily(user);
};

export const recoverFamilyAfterRemoval = async (currentUser: any) => {
  removeUserTags();
  return createNewFamily(currentUser);
};

export const subscribeToFamilyMembers = (
  familyId: string,
  callback: () => void,
) => {
  const membersRef = collection(db, "families", familyId, "members");
  return onSnapshot(
    query(membersRef),
    () => callback(),
    (error) => {
      console.error("Members snapshot error:", error);
    },
  );
};

export const fetchPendingInvitations = async (email: string) => {
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

  return { invitations, expiredIds };
};

export const markInvitationAsExpired = async (invitationId: string) => {
  const docRef = doc(db, "invitations", invitationId);
  await updateDoc(docRef, { status: "expired" });
};

export const sendFamilyInvitation = async (
  familyId: string,
  familyName: string,
  currentUser: any,
  targetEmail: string,
  members: FamilyMember[],
) => {
  if (!currentUser) throw new Error("Usuário não autenticado");

  const existingQ = query(
    collection(db, "invitations"),
    where("familyId", "==", familyId),
    where("toEmail", "==", targetEmail.trim().toLowerCase()),
    where("fromUserId", "==", currentUser.uid),
    where("status", "==", "pending"),
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error("Convite já enviado para este email");
  }

  const alreadyMember = members.some(
    (m) => m.email === targetEmail.trim().toLowerCase(),
  );
  if (alreadyMember) {
    throw new Error("Este email já é membro da família");
  }

  const normalizedEmail = targetEmail.trim().toLowerCase();
  const userQ = query(
    collection(db, "users"),
    where("email", "==", normalizedEmail),
  );
  const userSnap = await getDocs(userQ);
  if (userSnap.empty) {
    throw new Error("Este email não possui uma conta no app");
  }

  await addDoc(collection(db, "invitations"), {
    familyId,
    familyName,
    fromUserId: currentUser.uid,
    fromUserName: currentUser.displayName || "Administrador",
    toEmail: normalizedEmail,
    status: "pending",
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ),
  });

  await sendNotificationToEmail({
    email: normalizedEmail,
    title: "Convite de Familia",
    body: `${currentUser.displayName || "Alguem"} te convidou para a familia "${familyName}". Abra o app para aceitar.`,
    data: { type: "invitation" },
  });
};

export const acceptFamilyInvitation = async (
  invitationId: string,
  currentUser: any,
  currentFamilyId: string | null,
  refreshFamily: () => Promise<void>,
) => {
  if (!currentUser) throw new Error("Usuário não autenticado");

  const invRef = doc(db, "invitations", invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Convite não encontrado");

  const invData = invSnap.data();
  if (invData.status !== "pending") {
    throw new Error("Este convite não está mais disponível");
  }
  if (invData.toEmail?.toLowerCase() !== currentUser.email?.toLowerCase()) {
    throw new Error("Este convite não pertence ao usuário atual");
  }

  const targetFamilyId = invData.familyId;
  const targetFamilyName = invData.familyName || "Minha Família";

  const uid = currentUser.uid;
  const memberRef = doc(db, "families", targetFamilyId, "members", uid);
  const userRef = doc(db, "users", uid);
  const batch = writeBatch(db);

  batch.set(memberRef, {
    name: currentUser.displayName || "Membro",
    email: currentUser.email || "",
    photoURL: currentUser.photoURL || null,
    role: "member",
    invitationId,
    joinedAt: serverTimestamp(),
  });

  batch.set(
    userRef,
    {
      familyId: targetFamilyId,
      familyName: targetFamilyName,
      email: currentUser.email?.toLowerCase() || "",
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
};

export const declineFamilyInvitation = async (invitationId: string) => {
  const invRef = doc(db, "invitations", invitationId);
  await updateDoc(invRef, { status: "declined" });
};
