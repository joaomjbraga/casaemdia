import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import logger from '@/lib/logger';

export const SHOPPING_ITEM_POINTS = 3;

interface CompletionOptions {
  points: number;
  task?: boolean;
  shopping?: boolean;
}

const findMemberRef = async (familyId: string, memberIdOrName: string) => {
  if (!memberIdOrName) return null;

  const candidateRef = doc(db, 'families', familyId, 'members', memberIdOrName);
  const candidateSnap = await getDoc(candidateRef);
  if (candidateSnap.exists()) {
    return candidateRef;
  }

  const snap = await getDocs(collection(db, 'families', familyId, 'members'));
  const matches = snap.docs.filter((d) => d.data().name === memberIdOrName);

  if (matches.length === 1) {
    return doc(db, 'families', familyId, 'members', matches[0].id);
  }

  logger.warn(
    `[Gamification] Member "${memberIdOrName}" ambiguous: ${matches.length} matches, skipping`,
  );
  return null;
};

const applyCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
  delta: number,
) => {
  const memberRef = await findMemberRef(familyId, memberIdOrName);
  if (!memberRef) return;

  await runTransaction(db, async (transaction) => {
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) return;

    const data = memberSnap.data();
    const currentPoints = data.points ?? 0;
    const currentContributions = data.contributions ?? 0;
    const currentTasksCompleted = data.tasksCompleted ?? 0;
    const currentShoppingCompleted = data.shoppingCompleted ?? 0;

    const newPoints = Math.max(0, currentPoints + options.points * delta);
    const newContributions = Math.max(0, currentContributions + delta);
    const newTasksCompleted = options.task
      ? Math.max(0, currentTasksCompleted + delta)
      : currentTasksCompleted;
    const newShoppingCompleted = options.shopping
      ? Math.max(0, currentShoppingCompleted + delta)
      : currentShoppingCompleted;

    transaction.update(memberRef, {
      points: newPoints,
      contributions: newContributions,
      ...(options.task ? { tasksCompleted: newTasksCompleted } : {}),
      ...(options.shopping ? { shoppingCompleted: newShoppingCompleted } : {}),
    });
  });
};

export const creditCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
) => {
  await applyCompletion(familyId, memberIdOrName, options, 1);
};

export const revertCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
) => {
  await applyCompletion(familyId, memberIdOrName, options, -1);
};
