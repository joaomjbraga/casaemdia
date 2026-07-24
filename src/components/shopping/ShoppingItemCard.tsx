import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShoppingItemCardProps {
  name: string;
  done: boolean;
  quantity?: string;
  onToggle: () => void;
  onDelete: () => void;
  onEditQuantity: () => void;
  index?: number;
  isLast?: boolean;
  error?: boolean;
}

function getItemIcon(name: string): string {
  const lower = name.toLowerCase();
  if (
    lower.includes('fruta') ||
    lower.includes('banana') ||
    lower.includes('maçã') ||
    lower.includes('laranja') ||
    lower.includes('uva')
  )
    return 'food-apple';
  if (
    lower.includes('verdura') ||
    lower.includes('alface') ||
    lower.includes('tomate') ||
    lower.includes('cebola') ||
    lower.includes('cenoura')
  )
    return 'carrot';
  if (
    lower.includes('carne') ||
    lower.includes('frango') ||
    lower.includes('peixe') ||
    lower.includes('ovo')
  )
    return 'food-drumstick';
  if (
    lower.includes('leite') ||
    lower.includes('queijo') ||
    lower.includes('iogurte') ||
    lower.includes('manteiga')
  )
    return 'cow';
  if (
    lower.includes('pão') ||
    lower.includes('biscoito') ||
    lower.includes('bolo') ||
    lower.includes('torrada')
  )
    return 'bread-slice';
  if (
    lower.includes('limpeza') ||
    lower.includes('detergente') ||
    lower.includes('sabão') ||
    lower.includes('alvejante')
  )
    return 'spray-bottle';
  if (lower.includes('remédio') || lower.includes('medicamento') || lower.includes('farmácia'))
    return 'pill';
  return 'basket';
}

function getIconColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('fruta') || lower.includes('verdura')) return '#16A34A';
  if (lower.includes('carne') || lower.includes('frango')) return '#DC2626';
  if (lower.includes('limpeza')) return '#009394';
  if (lower.includes('remédio')) return '#7C3AED';
  return '#D97706';
}

export default function ShoppingItemCard({
  name,
  done,
  quantity,
  onToggle,
  onDelete,
  onEditQuantity,
  index = 0,
  isLast = false,
  error = false,
}: ShoppingItemCardProps) {
  const iconName = getItemIcon(name);
  const iconColor = done ? Colors.light.mutedText : getIconColor(name);
  const hasQty = !!quantity && quantity.trim().length > 0;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-4)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: index * 30,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 240,
        delay: index * 30,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeX]);

  return (
    <Animated.View
      style={[
        styles.row,
        !isLast && styles.rowDivider,
        error && styles.rowError,
        { opacity, transform: [{ translateX: Animated.add(translateX, shakeX) }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {done && <ZappIcon name="check" size={13} color="#fff" />}
      </TouchableOpacity>

      <View
        style={[
          styles.iconBadge,
          { backgroundColor: done ? Colors.light.cardDark : `${iconColor}12` },
        ]}
      >
        <ZappIcon name={iconName} size={16} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
          {name}
        </Text>
        {hasQty && (
          <TouchableOpacity style={styles.qtyTag} onPress={onEditQuantity} activeOpacity={0.7}>
            <Text style={[styles.qtyText, done && styles.qtyTextDone]} numberOfLines={1}>
              {quantity!.trim()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onEditQuantity}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <ZappIcon
            name={hasQty ? 'pencil-outline' : 'tag-plus-outline'}
            size={15}
            color={Colors.light.mutedText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <ZappIcon name="trash-can-outline" size={15} color={Colors.light.mutedText} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rowError: {
    backgroundColor: `${Colors.light.danger}08`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  qtyTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.mutedText,
    letterSpacing: 0.1,
  },
  qtyTextDone: {
    color: Colors.light.mutedText,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    padding: 6,
  },
});
