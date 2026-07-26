import IconCircleButton from '@/components/common/IconCircleButton';
import ScreenHeader from '@/components/common/ScreenHeader';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ShoppingListHeaderProps {
  hasCompletedItems: boolean;
  newItemName: string;
  newItemQty: string;
  filterName: string;
  onNewItemNameChange: (name: string) => void;
  onNewItemQtyChange: (qty: string) => void;
  onFilterChange: (filter: string) => void;
  onAddItem: () => void;
  onClearCompleted: () => void;
  onOpenAssigneePicker?: () => void;
  assigneeName?: string;
}

export default function ShoppingListHeader({
  hasCompletedItems,
  newItemName,
  newItemQty,
  filterName,
  onNewItemNameChange,
  onNewItemQtyChange,
  onFilterChange,
  onAddItem,
  onClearCompleted,
  onOpenAssigneePicker,
  assigneeName,
}: ShoppingListHeaderProps) {
  return (
    <View>
      <ScreenHeader
        iconName="cart-outline"
        title="Lista de Compras"
        subtitle="Gerencie os itens da família"
        iconBackgroundColor={`${Colors.light.primary}12`}
        iconColor={Colors.light.primary}
        subtitleColor={Colors.light.mutedText}
        actions={
          hasCompletedItems ? (
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
        footer={<View style={styles.footerDivider} />}
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
          <TouchableOpacity
            style={[styles.assigneeBtn, !!assigneeName && styles.assigneeBtnActive]}
            onPress={onOpenAssigneePicker}
            activeOpacity={0.7}
          >
            <ZappIcon
              name="account-outline"
              size={18}
              color={assigneeName ? Colors.light.primary : Colors.light.mutedText}
            />
            <Text style={[styles.assigneeLabel, !!assigneeName && styles.assigneeLabelActive]} numberOfLines={1}>
              {assigneeName || 'Responsável'}
            </Text>
          </TouchableOpacity>
          <IconCircleButton
            iconName="plus"
            onPress={onAddItem}
            size={44}
            backgroundColor={Colors.light.primary}
            borderColor={Colors.light.primary}
            iconColor="#fff"
            disabled={!newItemName.trim()}
          />
        </View>

        <TextInput
          style={styles.qtyInput}
          placeholder="observação (opcional)"
          placeholderTextColor={Colors.light.mutedText}
          value={newItemQty}
          onChangeText={onNewItemQtyChange}
          onSubmitEditing={onAddItem}
          returnKeyType="done"
        />

        <View style={styles.filterRow}>
          <ZappIcon name="magnify" size={18} color={Colors.light.mutedText} />
          <TextInput
            style={styles.filterInput}
            placeholder="Buscar item..."
            placeholderTextColor={Colors.light.mutedText}
            value={filterName}
            onChangeText={onFilterChange}
          />
          {filterName ? (
            <TouchableOpacity onPress={() => onFilterChange('')} activeOpacity={0.7}>
              <ZappIcon name="close-circle" size={20} color={Colors.light.mutedText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerDivider: {
    marginTop: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  addSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
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
  assigneeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    maxWidth: 160,
  },
  assigneeBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  assigneeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  assigneeLabelActive: {
    color: Colors.light.text,
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
    textAlignVertical: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
