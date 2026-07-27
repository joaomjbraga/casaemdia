import type { ShoppingItem } from '@/types/models';
import { api } from './api';
import { connectSocket } from './socket';

export const subscribeToShoppingApi = async (familyId: string, callback: (items: ShoppingItem[] | ((prev: ShoppingItem[]) => ShoppingItem[])) => void) => {
  const socket = await connectSocket();

  socket.on('connect', () => {
    socket.emit('family:join', { familyId });
  });

  const fetchItems = async () => {
    try {
      const data = await api.shopping.list(familyId);
      if (data?.items) {
        callback(data.items);
      }
    } catch (error) {
      console.error('fetchShopping error:', error);
    }
  };

  fetchItems();

  socket.on('shopping:created', ({ item }: { item: ShoppingItem }) => {
    callback((prev: ShoppingItem[]) => [...prev.filter((i: ShoppingItem) => i.id !== item.id), item]);
  });

  socket.on('shopping:updated', ({ item }: { item: ShoppingItem }) => {
    callback((prev: ShoppingItem[]) => prev.map((i: ShoppingItem) => (i.id === item.id ? item : i)));
  });

  socket.on('shopping:toggled', ({ item }: { item: ShoppingItem }) => {
    callback((prev: ShoppingItem[]) => prev.map((i: ShoppingItem) => (i.id === item.id ? item : i)));
  });

  socket.on('shopping:deleted', ({ itemId }: { itemId: string }) => {
    callback((prev: ShoppingItem[]) => prev.filter((i: ShoppingItem) => i.id !== itemId));
  });

  socket.on('shopping:cleared', () => {
    callback([]);
  });

  return () => {
    socket.off('shopping:created');
    socket.off('shopping:updated');
    socket.off('shopping:toggled');
    socket.off('shopping:deleted');
    socket.off('shopping:cleared');
    socket.emit('family:leave', { familyId });
  };
};

export const createShoppingItemApi = async (
  familyIdOrPayload: string | { familyId: string; name: string; quantity?: string; assigneeId?: string; assigneeName?: string; userName?: string; userId?: string },
  maybeName?: string,
  maybeQuantity?: string,
) => {
  let familyId: string;
  let name: string;
  let quantity: string | undefined;
  let assigneeId: string | undefined;
  let assigneeName: string | undefined;

  if (typeof familyIdOrPayload === 'string') {
    familyId = familyIdOrPayload;
    name = maybeName ?? '';
    quantity = maybeQuantity;
  } else {
    familyId = familyIdOrPayload.familyId;
    name = familyIdOrPayload.name;
    quantity = familyIdOrPayload.quantity;
    assigneeId = familyIdOrPayload.assigneeId;
    assigneeName = familyIdOrPayload.assigneeName;
  }

  const result = await api.shopping.create(familyId, { name, quantity, assigneeId, assigneeName });
  return result.item.id;
};

export const updateShoppingItemQuantityApi = async (
  familyIdOrPayload: string | { familyId: string; itemId: string; quantity: string; itemName?: string; userName?: string; userId?: string },
  maybeItemId?: string,
  maybeQuantity?: string,
) => {
  let familyId: string;
  let itemId: string;
  let quantity: string;

  if (typeof familyIdOrPayload === 'string') {
    familyId = familyIdOrPayload;
    itemId = maybeItemId ?? '';
    quantity = maybeQuantity ?? '';
  } else {
    familyId = familyIdOrPayload.familyId;
    itemId = familyIdOrPayload.itemId;
    quantity = familyIdOrPayload.quantity;
  }

  await api.shopping.updateQuantity(familyId, itemId, quantity);
};

export const toggleShoppingItemApi = async (
  inputOrFamilyId: { familyId: string; itemId: string; item: ShoppingItem; newDone: boolean } | string,
  maybeItemId?: string,
  maybeItem?: ShoppingItem,
  maybeNewDone?: boolean,
) => {
  let familyId: string;
  let itemId: string;

  if (typeof inputOrFamilyId === 'object' && inputOrFamilyId !== null && 'familyId' in inputOrFamilyId) {
    familyId = inputOrFamilyId.familyId;
    itemId = inputOrFamilyId.itemId;
  } else if (typeof inputOrFamilyId === 'string' && maybeItemId) {
    familyId = inputOrFamilyId;
    itemId = maybeItemId;
  } else {
    throw new Error('toggleShoppingItem: argumentos invalidos');
  }

  const result = await api.shopping.toggle(familyId, itemId);
  return result.item;
};

export const deleteShoppingItemApi = async (
  inputOrFamilyId: { familyId: string; itemId: string; itemName?: string; userName?: string } | string,
  maybeItemId?: string,
) => {
  let familyId: string;
  let itemId: string;

  if (typeof inputOrFamilyId === 'object' && inputOrFamilyId !== null && 'familyId' in inputOrFamilyId) {
    familyId = inputOrFamilyId.familyId;
    itemId = inputOrFamilyId.itemId;
  } else if (typeof inputOrFamilyId === 'string' && maybeItemId) {
    familyId = inputOrFamilyId;
    itemId = maybeItemId;
  } else {
    throw new Error('deleteShoppingItem: argumentos invalidos');
  }

  await api.shopping.delete(familyId, itemId);
};

export const deleteCompletedShoppingItemsApi = async (
  inputOrFamilyId: { familyId: string; items: ShoppingItem[]; userName?: string; userId?: string } | string,
  maybeItems?: ShoppingItem[],
) => {
  let familyId: string;

  if (typeof inputOrFamilyId === 'object' && inputOrFamilyId !== null && 'familyId' in inputOrFamilyId) {
    familyId = inputOrFamilyId.familyId;
  } else if (typeof inputOrFamilyId === 'string') {
    familyId = inputOrFamilyId;
  } else {
    throw new Error('deleteCompletedShoppingItems: argumentos invalidos');
  }

  const result = await api.shopping.deleteCompleted(familyId);
  return result.count;
};
