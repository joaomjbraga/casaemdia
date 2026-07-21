import type { FamilyMember, Invitation } from '@/types/models';
import {
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
} from 'firebase/firestore';
import { createNewFamily, migrateOrCreateFamily } from '../lib/family-migration';
import { db } from '../lib/firebase';
import { removeUserTags, sendNotificationToEmail } from '../lib/onesignal';
import logger from '@/lib/logger';

export const fetchFamilyMembers = async (familyId: string) => {
  const q = query(collection(db, 'families', familyId, 'members'), orderBy('joinedAt', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      email: data.email ?? '',
      photoURL: data.photoURL ?? null,
      role: (data.role ?? 'member') as 'admin' | 'member',
      points: data.points ?? 0,
      tasksCompleted: data.tasksCompleted ?? 0,
      shoppingCompleted: data.shoppingCompleted ?? 0,
      contributions: data.contributions ?? 0,
    };
  }) satisfies FamilyMember[];
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
  callback: (members: FamilyMember[]) => void,
) => {
  const membersRef = collection(db, 'families', familyId, 'members');
  return onSnapshot(
    query(membersRef),
    (snapshot) => {
      const membersList: FamilyMember[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          email: data.email ?? '',
          photoURL: data.photoURL ?? null,
          role: (data.role ?? 'member') as 'admin' | 'member',
          points: data.points ?? 0,
          tasksCompleted: data.tasksCompleted ?? 0,
          shoppingCompleted: data.shoppingCompleted ?? 0,
          contributions: data.contributions ?? 0,
        };
      });
      callback(membersList);
    },
    (error) => {
      logger.error('Members snapshot error:', error);
    },
  );
};

export const fetchPendingInvitations = async (email: string) => {
  const q = query(
    collection(db, 'invitations'),
    where('toEmail', '==', email),
    where('status', '==', 'pending'),
  );

  const snap = await getDocs(q);
  const now = Date.now();
  const expiredIds: string[] = [];
  const invitations: Invitation[] = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        familyId: data.familyId,
        familyName: data.familyName,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        toEmail: data.toEmail,
        status: data.status,
        createdAt: data.createdAt,
      };
    })
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
  const docRef = doc(db, 'invitations', invitationId);
  await updateDoc(docRef, { status: 'expired' });
};

export const sendFamilyInvitation = async (
  familyId: string,
  familyName: string,
  currentUser: any,
  targetEmail: string,
  members: FamilyMember[],
) => {
  if (!currentUser) throw new Error('Usuário não autenticado');

  const normalizedEmail = targetEmail.trim().toLowerCase();
  const invitationId = `${familyId}_${normalizedEmail}_${currentUser.uid}`;

  const existingRef = doc(db, 'invitations', invitationId);
  const existingSnap = await getDoc(existingRef);
  if (existingSnap.exists() && existingSnap.data().status === 'pending') {
    throw new Error('Convite já enviado para este email');
  }

  const alreadyMember = members.some((m) => m.email === normalizedEmail);
  if (alreadyMember) {
    throw new Error('Este email já é membro da família');
  }

  const userQ = query(collection(db, 'users'), where('email', '==', normalizedEmail));
  const userSnap = await getDocs(userQ);
  if (userSnap.empty) {
    throw new Error('Este email não possui uma conta no app');
  }

  const batch = writeBatch(db);

  batch.set(existingRef, {
    familyId,
    familyName,
    fromUserId: currentUser.uid,
    fromUserName: currentUser.displayName || 'Administrador',
    toEmail: normalizedEmail,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  });

  await batch.commit();

  try {
    await sendNotificationToEmail({
      email: normalizedEmail,
      title: 'Convite de Familia',
      body: `${currentUser.displayName || 'Alguem'} te convidou para a familia "${familyName}". Abra o app para aceitar.`,
      data: { type: 'invitation' },
    });
  } catch (error) {
    logger.error('Erro ao enviar notificação (convite):', error);
  }
};

export const acceptFamilyInvitation = async (
  invitationId: string,
  currentUser: any,
  currentFamilyId: string | null,
  refreshFamily: () => Promise<void>,
) => {
  if (!currentUser) throw new Error('Usuário não autenticado');

  const invRef = doc(db, 'invitations', invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error('Convite não encontrado');

  const invData = invSnap.data();
  if (invData.status !== 'pending') {
    throw new Error('Este convite não está mais disponível');
  }

  const expiresAt = invData.expiresAt;
  if (expiresAt && expiresAt.toMillis() < Date.now()) {
    throw new Error('Este convite expirou');
  }

  if (invData.toEmail?.toLowerCase() !== currentUser.email?.toLowerCase()) {
    throw new Error('Este convite não pertence ao usuário atual');
  }

  const targetFamilyId = invData.familyId;
  const targetFamilyName = invData.familyName || 'Minha Família';

  const uid = currentUser.uid;
  const memberRef = doc(db, 'families', targetFamilyId, 'members', uid);
  const userRef = doc(db, 'users', uid);
  const batch = writeBatch(db);

  const oldMemberData: Record<string, any> = {};

  if (currentFamilyId && currentFamilyId !== targetFamilyId) {
    const oldMemberRef = doc(db, 'families', currentFamilyId, 'members', uid);
    const oldMemberSnap = await getDoc(oldMemberRef);
    if (oldMemberSnap.exists()) {
      const oldData = oldMemberSnap.data();
      oldMemberData.points = oldData.points ?? 0;
      oldMemberData.tasksCompleted = oldData.tasksCompleted ?? 0;
      oldMemberData.shoppingCompleted = oldData.shoppingCompleted ?? 0;
      oldMemberData.contributions = oldData.contributions ?? 0;
    }
    batch.delete(oldMemberRef);
  }

  batch.set(memberRef, {
    name: currentUser.displayName || 'Membro',
    email: currentUser.email || '',
    photoURL: currentUser.photoURL || null,
    role: 'member',
    invitationId,
    joinedAt: serverTimestamp(),
    ...(oldMemberData.points ? { points: oldMemberData.points } : {}),
    ...(oldMemberData.tasksCompleted ? { tasksCompleted: oldMemberData.tasksCompleted } : {}),
    ...(oldMemberData.shoppingCompleted
      ? { shoppingCompleted: oldMemberData.shoppingCompleted }
      : {}),
    ...(oldMemberData.contributions ? { contributions: oldMemberData.contributions } : {}),
  });

  batch.set(
    userRef,
    {
      familyId: targetFamilyId,
      familyName: targetFamilyName,
      email: currentUser.email?.toLowerCase() || '',
      migratedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.update(invRef, { status: 'accepted' });
  await batch.commit();

  await refreshFamily();
};

export const declineFamilyInvitation = async (invitationId: string) => {
  const invRef = doc(db, 'invitations', invitationId);
  await updateDoc(invRef, { status: 'declined' });
};
