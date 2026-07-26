import type { ShoppingItem } from '@/types/models';
import {
  subscribeToShoppingApi as subscribeToShoppingItems,
  createShoppingItemApi as createShoppingItem,
  updateShoppingItemQuantityApi as updateShoppingItemQuantity,
  toggleShoppingItemApi as toggleShoppingItem,
  deleteShoppingItemApi as deleteShoppingItem,
  deleteCompletedShoppingItemsApi as clearCompletedShoppingItems,
} from './shopping-api';

export { subscribeToShoppingItems, createShoppingItem, updateShoppingItemQuantity, toggleShoppingItem, deleteShoppingItem, clearCompletedShoppingItems };
