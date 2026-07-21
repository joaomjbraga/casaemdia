import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/lib/logger';

const BATCH_LIMIT = 500;

export const deleteUserAccountFromFamily = async ({
  familyId,
  userId,
  deleteAccount,
}: {
  familyId: string;
  userId: string;
  deleteAccount: () => Promise<void>;
}) => {
  const membersSnap = await getDocs(collection(db, 'families', familyId, 'members'));
  const members = membersSnap.docs.map((d) => ({
    id: d.id,
    role: (d.data().role as string) || 'member',
  }));
  const otherMembers = members.filter((m) => m.id !== userId);

  if (otherMembers.length === 0) {
    const ops: { type: 'delete'; ref: any }[] = [];

    const subcollections = ['tasks', 'shopping_list'];
    for (const sub of subcollections) {
      try {
        const snap = await getDocs(collection(db, 'families', familyId, sub));
        for (const d of snap.docs) {
          ops.push({ type: 'delete', ref: d.ref });
        }
      } catch (subError) {
        logger.warn(`Leitura de ${sub} negada:`, subError);
      }
    }

    try {
      const invSnap = await getDocs(
        query(
          collection(db, 'invitations'),
          where('familyId', '==', familyId),
          where('fromUserId', '==', userId),
        ),
      );
      for (const d of invSnap.docs) {
        ops.push({ type: 'delete', ref: d.ref });
      }
    } catch (invError) {
      logger.warn('Leitura de convites negada:', invError);
    }

    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
      const chunk = ops.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.delete(op.ref);
      }
      await batch.commit();
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, 'families', familyId));
    await batch.commit();
  } else {
    const batch = writeBatch(db);

    const isDeletingLastAdmin =
      otherMembers.length > 0 && !otherMembers.some((m) => m.role === 'admin');
    if (isDeletingLastAdmin) {
      batch.update(doc(db, 'families', familyId, 'members', otherMembers[0].id), {
        role: 'admin',
      });
    }
    batch.delete(doc(db, 'families', familyId, 'members', userId));
    batch.delete(doc(db, 'users', userId));

    await batch.commit();
  }

  await deleteAccount();
};
