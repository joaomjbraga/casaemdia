import type { ShoppingItem } from "@/types/models";
import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import QuantityEditModal from "@/components/shopping/QuantityEditModal";
import ShoppingItemCard from "@/components/shopping/ShoppingItemCard";
import ShoppingListHeader from "@/components/shopping/ShoppingListHeader";
import ShoppingSectionHeader from "@/components/shopping/ShoppingSectionHeader";
import Colors from "@/constants/Colors";
import { DOCK_CLEARANCE } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useCelebration } from "@/hooks/useCelebration";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clearCompletedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  subscribeToShoppingItems,
  toggleShoppingItem,
  updateShoppingItemQuantity,
} from "@/services/shopping";


export default function ShoppingList() {
  const { user } = useAuth();
  const { familyId } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editQty, setEditQty] = useState("");
  const familyRef = useRef(familyId ?? null);

  const { celebrate, CelebrationOverlay } = useCelebration();

  useEffect(() => {
    familyRef.current = familyId ?? null;
  }, [familyId]);

  useEffect(() => {
    const currentFamilyId = familyId;
    if (!currentFamilyId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToShoppingItems(
      currentFamilyId,
      (mappedItems) => {
        setItems(mappedItems as ShoppingItem[]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [familyId]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const currentFamilyId = familyRef.current;
    if (!currentFamilyId || !user) return;

    const qty = newItemQty.trim();
    const tempId = Date.now().toString();
    const tempItem: ShoppingItem = {
      id: tempId,
      name: newItemName.trim(),
      done: false,
      quantity: qty,
    };

    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      return [...prev, tempItem];
    });
    setNewItemName("");
    setNewItemQty("");

    try {
      const docId = await createShoppingItem({
        familyId: currentFamilyId,
        name: newItemName.trim(),
        quantity: qty,
        userName: user.displayName || user.email?.split("@")[0] || "Alguem",
        userId: user.uid,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === tempId
            ? {
                id: docId,
                name: newItemName.trim(),
                done: false,
                quantity: qty,
              }
            : i,
        ),
      );
    } catch {
      setItems(() => snapshot);
      return;
    }
  };

  const openEditQuantity = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditQty(item.quantity ?? "");
  };

  const handleSaveQuantity = async () => {
    const item = editingItem;
    if (!item || !user) return;
    const currentFamilyId = familyRef.current;
    if (!currentFamilyId) return;

    const qty = editQty.trim();
    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      return prev.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i));
    });
    setEditingItem(null);
    setEditQty("");

    try {
      await updateShoppingItemQuantity({
        familyId: currentFamilyId,
        itemId: item.id,
        quantity: qty,
        itemName: item.name,
        userName: user.displayName || user.email?.split("@")[0] || "Alguem",
        userId: user.uid,
      });
    } catch {
      setItems(() => snapshot);
    }
  };

  const handleToggleItem = async (id: string) => {
    const currentFamilyId = familyRef.current;
    const item = items.find((i) => i.id === id);
    if (!item || !currentFamilyId) return;

    const newDone = !item.done;
    const willCompleteAll =
      newDone && totalCount >= 1 && completedCount === totalCount - 1;
    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      return prev.map((i) => (i.id === id ? { ...i, done: newDone } : i));
    });

    try {
      await toggleShoppingItem({
        familyId: currentFamilyId,
        itemId: id,
        item,
        newDone,
        user: user
          ? {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
            }
          : undefined,
      });

      if (newDone) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (willCompleteAll) celebrate();
    } catch {
      setItems(() => snapshot);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const currentFamilyId = familyRef.current;
    if (!currentFamilyId || !user) return;

    const deletedItem = items.find((i) => i.id === id);
    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      return prev.filter((i) => i.id !== id);
    });

    try {
      await deleteShoppingItem({
        familyId: currentFamilyId,
        itemId: id,
        itemName: deletedItem?.name,
        userName: user.displayName || user.email?.split("@")[0] || "Alguem",
        userId: user.uid,
      });
    } catch {
      setItems(() => snapshot);
      showAlert({
        title: "Erro",
        message: "Não foi possível excluir o item.",
        type: "error",
      });
    }
  };

  const handleClearCompleted = () => {
    const completed = items.filter((i) => i.done);
    if (completed.length === 0) return;

    showDialog({
      title: "Limpar Concluídos",
      message: `Remover ${completed.length} item(s) concluído(s)?`,
      type: "danger",
      confirmText: "Limpar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const currentFamilyId = familyRef.current;
        if (!currentFamilyId) return;

        const completedItems = items.filter((i) => i.done);
        let snapshot: ShoppingItem[] = [];
        setItems((prev) => {
          snapshot = prev;
          return prev.filter((i) => !i.done);
        });

        try {
          await clearCompletedShoppingItems({
            familyId: currentFamilyId,
            items: completedItems,
            userName:
              user?.displayName || user?.email?.split("@")[0] || "Alguem",
            userId: user?.uid,
          });
        } catch {
          setItems(() => snapshot);
        }
      },
    });
  };

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const pendingCount = totalCount - completedCount;

  const baseItems = filterName
    ? items.filter((item) =>
        item.name.toLowerCase().includes(filterName.toLowerCase()),
      )
    : items;

  const pendingItems = baseItems.filter((i) => !i.done);
  const completedItems = baseItems.filter((i) => i.done);

  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const renderHeader = () => (
    <ShoppingListHeader
      pendingCount={pendingCount}
      completedCount={completedCount}
      progress={progress}
      newItemName={newItemName}
      newItemQty={newItemQty}
      filterName={filterName}
      onNewItemNameChange={setNewItemName}
      onNewItemQtyChange={setNewItemQty}
      onFilterChange={setFilterName}
      onAddItem={handleAddItem}
      onClearCompleted={handleClearCompleted}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      iconName="cart-outline"
      iconSize={40}
      iconColor={Colors.light.primary}
      iconBackgroundColor={Colors.light.accentPurpleSurface}
      title={filterName ? "Nenhum resultado" : "Lista vazia"}
      subtitle={
        filterName ? "Tente buscar outro termo" : "Adicione itens à sua lista"
      }
    />
  );

  if (!familyId) {
    return <LoadingSkeleton variant="shopping" />;
  }

  const renderSectionHeader = (label: string, count: number) => (
    <ShoppingSectionHeader label={label} count={count} />
  );

  const renderList = () => {
    if (loading && items.length === 0) {
      return <LoadingSkeleton variant="shopping" />;
    }

    const rows: React.ReactElement[] = [];
    if (pendingItems.length > 0) {
      rows.push(
        <View key="pending-header">
          {renderSectionHeader("A comprar", pendingItems.length)}
        </View>,
      );
      pendingItems.forEach((item) =>
        rows.push(
          <ShoppingItemCard
            key={item.id}
            name={item.name}
            done={item.done}
            quantity={item.quantity}
            onToggle={() => handleToggleItem(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
            onEditQuantity={() => openEditQuantity(item)}
          />,
        ),
      );
    }
    if (completedItems.length > 0) {
      rows.push(
        <View key="done-header" style={styles.sectionHeaderDone}>
          {renderSectionHeader("Comprados", completedItems.length)}
        </View>,
      );
      completedItems.forEach((item) =>
        rows.push(
          <ShoppingItemCard
            key={item.id}
            name={item.name}
            done={item.done}
            quantity={item.quantity}
            onToggle={() => handleToggleItem(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
            onEditQuantity={() => openEditQuantity(item)}
          />,
        ),
      );
    }

    return (
      <View style={styles.listWrap}>
        {renderHeader()}
        {items.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.listContent}>{rows}</View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerSpacer} />

      {renderList()}

      <QuantityEditModal
        visible={!!editingItem}
        itemName={editingItem?.name ?? ""}
        quantity={editQty}
        onQuantityChange={setEditQty}
        onSave={handleSaveQuantity}
        onClose={() => setEditingItem(null)}
      />

      <CelebrationOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  statusBarSpacer: {},
  headerSpacer: {
    height: 12,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    opacity: 0.9,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: DOCK_CLEARANCE,
    paddingTop: 4,
  },
  sectionHeaderDone: {
    marginTop: 8,
  },
});
