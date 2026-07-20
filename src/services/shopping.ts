import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  creditCompletion,
  revertCompletion,
  SHOPPING_ITEM_POINTS,
} from "../lib/gamification";
import { sendNotificationToFamily } from "../lib/onesignal";

export interface ShoppingItemSnapshot {
  id: string;
  name: string;
  done: boolean;
  quantity?: string;
  points?: number;
}

export const subscribeToShoppingItems = (
  familyId: string,
  callback: (items: ShoppingItemSnapshot[]) => void,
) => {
  const q = query(collection(db, "families", familyId, "shopping_list"));

  return onSnapshot(
    q,
    (snapshot) => {
      const mappedItems: ShoppingItemSnapshot[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().title,
        done: d.data().done,
        quantity: d.data().quantity ?? "",
        points: d.data().points ?? SHOPPING_ITEM_POINTS,
      }));

      callback(mappedItems);
    },
    (error) => {
      console.error("Shopping snapshot error:", error);
    },
  );
};

export const createShoppingItem = async ({
  familyId,
  name,
  quantity,
  userName,
  userId,
}: {
  familyId: string;
  name: string;
  quantity: string;
  userName?: string;
  userId?: string;
}) => {
  const docRef = await addDoc(
    collection(db, "families", familyId, "shopping_list"),
    {
      title: name,
      done: false,
      quantity,
      points: SHOPPING_ITEM_POINTS,
    },
  );

  if (userName && userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: userId,
      title: "Item adicionado",
      body: `${userName} adicionou "${name}" na lista de compras`,
    });
  }

  return docRef.id;
};

export const updateShoppingItemQuantity = async ({
  familyId,
  itemId,
  quantity,
  itemName,
  userName,
  userId,
}: {
  familyId: string;
  itemId: string;
  quantity: string;
  itemName: string;
  userName?: string;
  userId?: string;
}) => {
  const itemRef = doc(db, "families", familyId, "shopping_list", itemId);
  await updateDoc(itemRef, { quantity });

  if (userName && userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: userId,
      title: "Item atualizado",
      body: `${userName} atualizou "${itemName}" na lista de compras`,
    });
  }
};

export const toggleShoppingItem = async ({
  familyId,
  itemId,
  item,
  newDone,
  user,
}: {
  familyId: string;
  itemId: string;
  item: ShoppingItemSnapshot;
  newDone: boolean;
  user?: { uid: string; displayName?: string | null; email?: string | null };
}) => {
  const itemRef = doc(db, "families", familyId, "shopping_list", itemId);
  await updateDoc(itemRef, { done: newDone });

  if (user) {
    const itemPoints = item.points ?? SHOPPING_ITEM_POINTS;
    try {
      if (newDone) {
        await creditCompletion(familyId, user.uid, {
          points: itemPoints,
          shopping: true,
        });
      } else {
        await revertCompletion(familyId, user.uid, {
          points: itemPoints,
          shopping: true,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar gamificação (compra):", error);
    }

    const userName = user.displayName || user.email?.split("@")[0] || "Alguem";
    await sendNotificationToFamily({
      familyId,
      excludeUserId: user.uid,
      title: newDone ? "Item comprado" : "Item desmarcado",
      body: newDone
        ? `${userName} comprou "${item.name}"`
        : `${userName} desmarcou "${item.name}" na lista de compras`,
    });
  }
};

export const deleteShoppingItem = async ({
  familyId,
  itemId,
  itemName,
  userName,
  userId,
}: {
  familyId: string;
  itemId: string;
  itemName?: string;
  userName?: string;
  userId?: string;
}) => {
  const itemRef = doc(db, "families", familyId, "shopping_list", itemId);
  await deleteDoc(itemRef);

  if (userName && userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: userId,
      title: "Item removido",
      body: `${userName} removeu "${itemName ?? "item"}" da lista de compras`,
    });
  }
};

export const clearCompletedShoppingItems = async ({
  familyId,
  items,
  userName,
  userId,
}: {
  familyId: string;
  items: ShoppingItemSnapshot[];
  userName?: string;
  userId?: string;
}) => {
  const batch = writeBatch(db);
  for (const item of items) {
    batch.delete(doc(db, "families", familyId, "shopping_list", item.id));
  }
  await batch.commit();

  if (userName && userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: userId,
      title: "Lista limpa",
      body: `${userName} removeu ${items.length} itens comprados da lista`,
    });
  }
};
