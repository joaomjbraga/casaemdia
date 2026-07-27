import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import QuantityEditModal from '@/components/shopping/QuantityEditModal';
import ShoppingItemCard from '@/components/shopping/ShoppingItemCard';
import ShoppingListHeader from '@/components/shopping/ShoppingListHeader';
import ShoppingSectionHeader from '@/components/shopping/ShoppingSectionHeader';
import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import {
  clearCompletedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  subscribeToShoppingItems,
  toggleShoppingItem,
  updateShoppingItemQuantity,
} from '@/services/shopping';
import type { ShoppingItem } from '@/types/models';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ZappIcon from '@/components/common/ZappIcon';

export default function ShoppingList() {
  const { user } = useAuth();
  const { familyId, members } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemAssigneeId, setNewItemAssigneeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editQty, setEditQty] = useState('');
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const familyRef = useRef(familyId ?? null);
  const [errorItemId, setErrorItemId] = useState<string | null>(null);
  const nameInputRef = useRef<TextInput>(null);

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

    let cleanup: (() => void) | undefined;

    subscribeToShoppingItems(currentFamilyId, (mappedItems) => {
      const safeMappedItems = Array.isArray(mappedItems)
        ? mappedItems.filter((item): item is ShoppingItem => Boolean(item && typeof item.name === 'string'))
        : [];
      setItems(safeMappedItems);
      setLoading(false);
    }).then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      cleanup?.();
    };
  }, [familyId]);

  const openAdd = () => {
    nameInputRef.current?.focus();
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const currentFamilyId = familyRef.current;
    if (!currentFamilyId || !user) return;

    const qty = newItemQty.trim();
    const tempId = Date.now().toString();
    const assignee = members.find((m) => m.id === newItemAssigneeId);
    const tempItem: ShoppingItem = {
      id: tempId,
      name: newItemName.trim(),
      done: false,
      quantity: qty,
      assigneeId: newItemAssigneeId ?? undefined,
      assignee: assignee?.name,
    };

    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      return [...prev, tempItem];
    });
    setNewItemName('');
    setNewItemQty('');
    setNewItemAssigneeId(null);

    try {
      const docId = await createShoppingItem({
        familyId: currentFamilyId,
        name: newItemName.trim(),
        quantity: qty,
        assigneeId: newItemAssigneeId ?? undefined,
        assigneeName: assignee?.name,
        userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
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
                assigneeId: newItemAssigneeId ?? undefined,
                assignee: assignee?.name,
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
    setEditQty(item.quantity ?? '');
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
    setEditQty('');

    try {
      await updateShoppingItemQuantity({
        familyId: currentFamilyId,
        itemId: item.id,
        quantity: qty,
        itemName: item.name,
        userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
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
      });

      setErrorItemId(null);

      if (newDone) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      setItems(() => snapshot);
      setErrorItemId(id);
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
        userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
      });
    } catch {
      setItems(() => snapshot);
      showAlert({
        title: 'Erro',
        message: 'Não foi possível excluir o item.',
        type: 'error',
      });
    }
  };

  const handleClearCompleted = () => {
    const completed = safeItems.filter((i) => i.done);
    if (completed.length === 0) return;

    showDialog({
      title: 'Limpar Concluídos',
      message: `Remover ${completed.length} item(s) concluído(s)?`,
      type: 'danger',
      confirmText: 'Limpar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const currentFamilyId = familyRef.current;
        if (!currentFamilyId) return;

        const completedItems = safeItems.filter((i) => i.done);
        let snapshot: ShoppingItem[] = [];
        setItems((prev) => {
          snapshot = prev;
          return prev.filter((i) => !i?.done);
        });

        try {
          await clearCompletedShoppingItems({
            familyId: currentFamilyId,
            items: completedItems,
            userName: user?.displayName || user?.email?.split('@')[0] || 'Alguém',
            userId: user?.uid,
          });
        } catch {
          setItems(() => snapshot);
        }
      },
    });
  };

  const safeItems = Array.isArray(items) ? items.filter((item) => item && typeof item.name === 'string') : [];
  const hasCompletedItems = safeItems.some((i) => i.done);

  const baseItems = filterName
    ? safeItems.filter((item) => item.name.toLowerCase().includes(filterName.toLowerCase()))
    : safeItems;

  const pendingItems = baseItems.filter((i) => !i.done);
  const completedItems = baseItems.filter((i) => i.done);

  const renderHeader = () => {
    const assignee = members.find((m) => m.id === newItemAssigneeId);
    return (
      <ShoppingListHeader
        hasCompletedItems={hasCompletedItems}
        newItemName={newItemName}
        newItemQty={newItemQty}
        filterName={filterName}
        onNewItemNameChange={setNewItemName}
        onNewItemQtyChange={setNewItemQty}
        onFilterChange={setFilterName}
        onAddItem={handleAddItem}
        onClearCompleted={handleClearCompleted}
        onOpenAssigneePicker={() => setShowAssigneePicker(true)}
        assigneeName={assignee?.name}
        nameInputRef={nameInputRef}
      />
    );
  };

  const renderEmpty = () => (
    <EmptyState
      iconName="cart-outline"
      iconSize={40}
      iconColor={Colors.light.primary}
      iconBackgroundColor={`${Colors.light.primary}12`}
      title={filterName ? 'Nenhum resultado' : 'Lista vazia'}
      subtitle={filterName ? 'Tente buscar outro termo' : 'Adicione itens à sua lista'}
      actionLabel={filterName ? undefined : 'Adicionar item'}
      onAction={filterName ? undefined : openAdd}
    />
  );

  if (!familyId) {
    return <LoadingSkeleton variant="shopping" />;
  }

  const renderSectionHeader = (label: string) => {
    return <ShoppingSectionHeader label={label} />;
  };

  const renderList = () => {
    if (loading && items.length === 0) {
      return <LoadingSkeleton variant="shopping" />;
    }

    const safePendingItems = safeItems.filter((i) => !i.done);
    const safeCompletedItems = safeItems.filter((i) => i.done);

    const rows: React.ReactElement[] = [];
    if (safePendingItems.length > 0) {
      rows.push(<View key="pending-header">{renderSectionHeader('A comprar')}</View>);
      safePendingItems.forEach((item, idx) => {
        if (!item) return;
        rows.push(
          <ShoppingItemCard
            key={item.id}
            name={item.name}
            done={item.done}
            quantity={item.quantity ?? undefined}
            assignee={item.assignee ?? undefined}
            onToggle={() => handleToggleItem(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
            onEditQuantity={() => openEditQuantity(item)}
            index={idx}
            error={errorItemId === item.id}
          />,
        );
      });
    }
    if (safeCompletedItems.length > 0) {
      rows.push(
        <View key="done-header" style={styles.sectionHeaderDone}>
          {renderSectionHeader('Comprados')}
        </View>,
      );
      safeCompletedItems.forEach((item, idx) =>
        rows.push(
          <ShoppingItemCard
            key={item.id}
            name={item.name}
            done={item.done}
            quantity={item.quantity ?? undefined}
            assignee={item.assignee ?? undefined}
            onToggle={() => handleToggleItem(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
            onEditQuantity={() => openEditQuantity(item)}
            index={idx}
            error={errorItemId === item.id}
          />,
        ),
      );
    }

    return (
      <ScrollView style={styles.listWrap} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {safeItems.length === 0 ? renderEmpty() : <View style={styles.listContent}>{rows}</View>}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerSpacer} />

      {renderList()}

      <Modal visible={showAssigneePicker} animationType="slide" onRequestClose={() => setShowAssigneePicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Responsável</Text>
            <TouchableOpacity onPress={() => setShowAssigneePicker(false)} activeOpacity={0.7}>
              <ZappIcon name="close" size={22} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum membro cadastrado</Text>
            ) : (
              members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberRow, newItemAssigneeId === member.id && styles.memberRowActive]}
                  onPress={() => {
                    setNewItemAssigneeId(member.id);
                    setShowAssigneePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>{(member.name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  {newItemAssigneeId === member.id && (
                    <ZappIcon name="check" size={20} color={Colors.light.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      <QuantityEditModal
        visible={!!editingItem}
        itemName={editingItem?.name ?? ''}
        quantity={editQty}
        onQuantityChange={setEditQty}
        onSave={handleSaveQuantity}
        onClose={() => setEditingItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerSpacer: {
    height: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    padding: 16,
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  memberRowActive: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  memberEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.mutedText,
    textAlign: 'center',
    marginTop: 24,
  },
});
