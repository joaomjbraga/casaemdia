import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import ShoppingItemCard from "@/components/shopping/ShoppingItemCard";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useCelebration } from "@/hooks/useCelebration";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/common/EmptyState";
import IconCircleButton from "../../components/common/IconCircleButton";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import PrimaryIconButton from "../../components/common/PrimaryIconButton";
import SectionTitle from "../../components/common/SectionTitle";
import Colors from "../../constants/Colors";
import {
  clearCompletedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  subscribeToShoppingItems,
  toggleShoppingItem,
  updateShoppingItemQuantity,
} from "../../services/shopping";

interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
  quantity?: string;
  points?: number;
}

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

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const statusBarHeight = RNStatusBar.currentHeight || 24;

  const renderHeader = () => (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color="#fff"
            />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Lista de Compras</Text>
            <Text style={styles.headerSubtitle}>
              {pendingCount} a comprar · {completedCount} comprado
              {completedCount !== 1 ? "s" : ""}
            </Text>
          </View>
          {completedCount > 0 && (
            <IconCircleButton
              iconName="broom"
              onPress={handleClearCompleted}
              size={40}
              backgroundColor="rgba(248, 81, 73, 0.15)"
              borderColor="rgba(248, 81, 73, 0.3)"
              iconColor="#FFFFFF"
            />
          )}
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.addSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Adicionar item..."
            placeholderTextColor={Colors.light.mutedText}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <PrimaryIconButton
            iconName="plus"
            onPress={handleAddItem}
            disabled={!newItemName.trim()}
          />
        </View>

        <TextInput
          style={styles.qtyInput}
          placeholder="Quantidade / observação (opcional) — ex: 2L, marca X"
          placeholderTextColor={Colors.light.mutedText}
          value={newItemQty}
          onChangeText={setNewItemQty}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />

        <View style={styles.filterRow}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={Colors.light.mutedText}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Buscar item..."
            placeholderTextColor={Colors.light.mutedText}
            value={filterName}
            onChangeText={setFilterName}
          />
          {filterName ? (
            <TouchableOpacity
              onPress={() => setFilterName("")}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={Colors.light.mutedText}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );

  const renderEmpty = () => (
    <EmptyState
      iconName="cart-outline"
      iconSize={40}
      iconColor={Colors.light.primary}
      iconBackgroundColor="rgba(162, 89, 255, 0.12)"
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
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionDot} />
        <SectionTitle
          label={label}
          color="#FFFFFF"
          fontSize={15}
          fontWeight="800"
          letterSpacing={-0.2}
        />
      </View>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
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
      <StatusBar style="light" />

      <LinearGradient
        colors={["#1A1033", "#000000"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[styles.statusBarSpacer, { height: statusBarHeight }]}
      />

      {renderList()}

      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingItem(null)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>{editingItem?.name}</Text>
            <Text style={styles.modalLabel}>Quantidade / observação</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 2L, marca X, 500g"
              placeholderTextColor={Colors.light.mutedText}
              value={editQty}
              onChangeText={setEditQty}
              autoFocus
              onSubmitEditing={handleSaveQuantity}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditingItem(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveQuantity}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <CelebrationOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  statusBarSpacer: {},
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    opacity: 0.9,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(162, 89, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3FB950",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3FB950",
    minWidth: 38,
    textAlign: "right",
  },
  addSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: "rgba(13, 17, 23, 0.8)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 0.6)",
  },
  qtyInput: {
    backgroundColor: "rgba(13, 17, 23, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 0.6)",
    paddingHorizontal: 16,
    height: 52,
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
    textAlignVertical: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 17, 23, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 0.6)",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.mutedText,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  sectionHeaderDone: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#161B22",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.12)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.mutedText,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "rgba(13, 17, 23, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modalSave: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
