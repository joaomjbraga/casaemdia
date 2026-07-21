import IconCircleButton from "@/components/common/IconCircleButton";
import PrimaryIconButton from "@/components/common/PrimaryIconButton";
import ProgressBar from "@/components/common/ProgressBar";
import ScreenHeader from "@/components/common/ScreenHeader";
import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ShoppingListHeaderProps {
  pendingCount: number;
  completedCount: number;
  progress: number;
  newItemName: string;
  newItemQty: string;
  filterName: string;
  onNewItemNameChange: (name: string) => void;
  onNewItemQtyChange: (qty: string) => void;
  onFilterChange: (filter: string) => void;
  onAddItem: () => void;
  onClearCompleted: () => void;
}

export default function ShoppingListHeader({
  pendingCount,
  completedCount,
  progress,
  newItemName,
  newItemQty,
  filterName,
  onNewItemNameChange,
  onNewItemQtyChange,
  onFilterChange,
  onAddItem,
  onClearCompleted,
}: ShoppingListHeaderProps) {
  return (
    <View>
      <ScreenHeader
        iconName="cart-outline"
        title="Lista de Compras"
        subtitle={`${pendingCount} a comprar · ${completedCount} comprado${completedCount !== 1 ? "s" : ""}`}
        iconBackgroundColor={Colors.light.accentPurpleSurface}
        iconColor={Colors.light.accentPurple}
        subtitleColor={Colors.light.mutedText}
        actions={
          completedCount > 0 ? (
            <IconCircleButton
              iconName="broom"
              onPress={onClearCompleted}
              size={36}
              backgroundColor="rgba(255, 59, 48, 0.1)"
              borderColor="rgba(255, 59, 48, 0.2)"
              iconColor={Colors.light.danger}
            />
          ) : undefined
        }
        footer={
          <View style={styles.progressWrap}>
            <ProgressBar
              progress={progress}
              height={6}
              color={Colors.light.success}
            />
          </View>
        }
      />

      <View style={styles.addSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Adicionar item..."
            placeholderTextColor={Colors.light.mutedText}
            value={newItemName}
            onChangeText={onNewItemNameChange}
            onSubmitEditing={onAddItem}
            returnKeyType="done"
          />
          <PrimaryIconButton
            iconName="plus"
            onPress={onAddItem}
            disabled={!newItemName.trim()}
          />
        </View>

        <TextInput
          style={styles.qtyInput}
          placeholder="Quantidade / observação (opcional) — ex: 2L, marca X"
          placeholderTextColor={Colors.light.mutedText}
          value={newItemQty}
          onChangeText={onNewItemQtyChange}
          onSubmitEditing={onAddItem}
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
            onChangeText={onFilterChange}
          />
          {filterName ? (
            <TouchableOpacity
              onPress={() => onFilterChange("")}
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
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginTop: 14,
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
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  qtyInput: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
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
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
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
});
