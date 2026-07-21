import type { FamilyMember } from "@/types/models";
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
import { db } from "../lib/firebase";
import { sendNotificationToEmail } from "../lib/onesignal";


export const fetchFamilyMembersFromStore = async (
  familyId: string,
): Promise<FamilyMember[]> => {
  const q = query(
    collection(db, "families", familyId, "members"),
    orderBy("name", "asc"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
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
};


export const deleteFamilyMemberFromStore = async ({
  familyId,
  memberId,
  memberName,
  memberEmail,
  familyName,
}: {
  familyId: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  familyName?: string;
}) => {
  const tasksSnapshot = await getDocs(
    collection(db, "families", familyId, "tasks"),
  );
  const memberTasks = tasksSnapshot.docs.filter(
    (d) => d.data().assignee === memberName,
  );

  if (memberTasks.length > 0) {
    throw new Error(
      "Não é possível remover este membro, pois ele tem tarefas atribuídas.",
    );
  }

  await deleteDoc(doc(db, "families", familyId, "members", memberId));

  if (memberEmail) {
    await sendNotificationToEmail({
      email: memberEmail,
      title: "Você saiu da família",
      body: `Você foi removido da família "${familyName ?? "Minha Família"}".`,
      data: { type: "member_removed" },
    });
  }
};
