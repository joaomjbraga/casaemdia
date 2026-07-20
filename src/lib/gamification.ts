import {
  collection,
  doc,
  getDocs,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export const SHOPPING_ITEM_POINTS = 3;

interface CompletionOptions {
  points: number;
  task?: boolean;
  shopping?: boolean;
}

/**
 * Resolve o documento de membro usando o identificador do membro quando possível,
 * com fallback para o nome para manter compatibilidade com dados antigos.
 */
const findMemberRef = async (familyId: string, memberIdOrName: string) => {
  const snap = await getDocs(collection(db, "families", familyId, "members"));

  const match = snap.docs.find((d) => {
    if (d.id === memberIdOrName) return true;
    return d.data().name === memberIdOrName;
  });

  return match ? doc(db, "families", familyId, "members", match.id) : null;
};

const applyCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
  delta: number,
) => {
  const memberRef = await findMemberRef(familyId, memberIdOrName);
  if (!memberRef) return;

  const batch = writeBatch(db);
  batch.update(memberRef, {
    points: increment(options.points * delta),
    contributions: increment(delta),
    ...(options.task ? { tasksCompleted: increment(delta) } : {}),
    ...(options.shopping ? { shoppingCompleted: increment(delta) } : {}),
  });
  await batch.commit();
};

/**
 * Credita pontos/contribuições a um membro quando ele conclui uma atividade.
 * Usa `increment()` para ser seguro contra concorrência/race conditions.
 */
export const creditCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
) => {
  await applyCompletion(familyId, memberIdOrName, options, 1);
};

/**
 * Estorna os pontos/contribuições creditados quando uma atividade é reaberta.
 */
export const revertCompletion = async (
  familyId: string,
  memberIdOrName: string,
  options: CompletionOptions,
) => {
  await applyCompletion(familyId, memberIdOrName, options, -1);
};
