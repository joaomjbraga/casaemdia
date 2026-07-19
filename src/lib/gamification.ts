import { collection, doc, getDocs, increment, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export const SHOPPING_ITEM_POINTS = 3;

/**
 * Localiza o documento de membro cujo nome corresponde ao responsável, para
 * creditar/estornar pontos de gamificação. A correspondência é por nome
 * (igual ao usado no campo `assignee` das tarefas).
 */
const findMemberRefByName = async (familyId: string, name: string) => {
  const snap = await getDocs(
    collection(db, "families", familyId, "members"),
  );
  const match = snap.docs.find((d) => d.data().name === name);
  return match ? doc(db, "families", familyId, "members", match.id) : null;
};

/**
 * Credita pontos/contribuições a um membro quando ele conclui uma atividade.
 * Usa `increment()` para ser seguro contra concorrência/race conditions.
 */
export const creditCompletion = async (
  familyId: string,
  assigneeName: string,
  options: { points: number; task?: boolean; shopping?: boolean },
) => {
  const memberRef = await findMemberRefByName(familyId, assigneeName);
  if (!memberRef) return;

  const batch = writeBatch(db);
  batch.update(memberRef, {
    points: increment(options.points),
    contributions: increment(1),
    ...(options.task ? { tasksCompleted: increment(1) } : {}),
    ...(options.shopping ? { shoppingCompleted: increment(1) } : {}),
  });
  await batch.commit();
};

/**
 * Estorna os pontos/contribuições creditados quando uma atividade é reaberta.
 */
export const revertCompletion = async (
  familyId: string,
  assigneeName: string,
  options: { points: number; task?: boolean; shopping?: boolean },
) => {
  const memberRef = await findMemberRefByName(familyId, assigneeName);
  if (!memberRef) return;

  const batch = writeBatch(db);
  batch.update(memberRef, {
    points: increment(-options.points),
    contributions: increment(-1),
    ...(options.task ? { tasksCompleted: increment(-1) } : {}),
    ...(options.shopping ? { shoppingCompleted: increment(-1) } : {}),
  });
  await batch.commit();
};
