import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const deleteUserAccountFromFamily = async ({
  familyId,
  userId,
  deleteAccount,
}: {
  familyId: string;
  userId: string;
  deleteAccount: () => Promise<void>;
}) => {
  const batch = writeBatch(db);

  const membersSnap = await getDocs(
    collection(db, "families", familyId, "members"),
  );
  const members = membersSnap.docs.map((d) => ({
    id: d.id,
    role: (d.data().role as string) || "member",
  }));
  const otherMembers = members.filter((m) => m.id !== userId);

  if (otherMembers.length === 0) {
    const subcollections = ["tasks", "shopping_list"];
    for (const sub of subcollections) {
      try {
        const snap = await getDocs(collection(db, "families", familyId, sub));
        for (const d of snap.docs) batch.delete(d.ref);
      } catch (subError) {
        console.warn(`Leitura de ${sub} negada:`, subError);
      }
    }

    try {
      const invSnap = await getDocs(
        query(
          collection(db, "invitations"),
          where("familyId", "==", familyId),
          where("fromUserId", "==", userId),
        ),
      );
      for (const d of invSnap.docs) batch.delete(d.ref);
    } catch (invError) {
      console.warn("Leitura de convites negada:", invError);
    }

    batch.delete(doc(db, "families", familyId));
  } else {
    const isOnlyAdmin =
      otherMembers.length > 0 && !otherMembers.some((m) => m.role === "admin");
    if (isOnlyAdmin) {
      const nextAdmin =
        otherMembers.find((m) => m.role === "admin") ?? otherMembers[0];
      batch.update(doc(db, "families", familyId, "members", nextAdmin.id), {
        role: "admin",
      });
    }
    batch.delete(doc(db, "families", familyId, "members", userId));
  }

  batch.delete(doc(db, "users", userId));
  await batch.commit();
  await deleteAccount();
};
