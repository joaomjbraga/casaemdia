import type { ShoppingItem } from '@/types/models';
import {
  subscribeToShoppingApi as subscribeToShoppingItems,
  createShoppingItemApi as createShoppingItem,
  updateShoppingItemQuantityApi as updateShoppingItemQuantity,
  toggleShoppingItemApi as toggleShoppingItem,
  deleteShoppingItemApi as deleteShoppingItem,
  deleteCompletedShoppingItemsApi as clearCompletedShoppingItems,
} from './shopping-api';
import { api } from './api';

export { subscribeToShoppingItems, createShoppingItem, updateShoppingItemQuantity, toggleShoppingItem, deleteShoppingItem, clearCompletedShoppingItems };

export const fetchDashboardShopping = async (familyId: string): Promise<ShoppingItem[]> => {
  const data = await api.shopping.list(familyId);
  return data?.items ?? [];
};
