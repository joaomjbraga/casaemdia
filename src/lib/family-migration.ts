import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface FamilyData {
  familyId: string;
  familyName: string;
}

/**
 * Cria uma nova família com o usuário como admin e aponta `users/{uid}` para
 * ela. Sempre cria uma família nova (sobrescrevendo o familyId anterior).
 */
async function createFamilyForUser(user: User): Promise<FamilyData> {
  const uid = user.uid;
  const userDocRef = doc(db, 'users', uid);

  const familyName = user.displayName || user.email?.split('@')[0] || 'Minha Família';
  const familyRef = doc(collection(db, 'families'));
  const familyId = familyRef.id;

  const memberRef = doc(db, 'families', familyId, 'members', uid);
  const setupBatch = writeBatch(db);
  setupBatch.set(familyRef, {
    name: familyName,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  setupBatch.set(memberRef, {
    name: user.displayName || 'Admin',
    email: user.email || '',
    photoURL: user.photoURL || null,
    role: 'admin',
    joinedAt: serverTimestamp(),
  });
  setupBatch.set(userDocRef, {
    familyId,
    familyName,
    migratedAt: serverTimestamp(),
  }, { merge: true });
  await setupBatch.commit();

  return { familyId, familyName };
}

export async function migrateOrCreateFamily(user: User): Promise<FamilyData> {
  const uid = user.uid;
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists() && userSnap.data()?.familyId) {
    return {
      familyId: userSnap.data().familyId,
      familyName: userSnap.data().familyName || 'Minha Família',
    };
  }

  return createFamilyForUser(user);
}

/**
 * Força a criação de uma nova família para o usuário, mesmo que ele já possua um
 * `familyId`. Usado na recuperação após o usuário ser removido de uma família.
 */
export async function createNewFamily(user: User): Promise<FamilyData> {
  return createFamilyForUser(user);
}
