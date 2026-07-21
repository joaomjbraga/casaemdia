import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface ShoppingItemCardProps {
  name: string;
  done: boolean;
  quantity?: string;
  onToggle: () => void;
  onDelete: () => void;
  onEditQuantity: () => void;
  index?: number;
  error?: boolean;
}

function getItemIcon(name: string): string {
  const lower = name.toLowerCase();
  if (
    lower.includes("fruta") ||
    lower.includes("banana") ||
    lower.includes("maçã") ||
    lower.includes("laranja") ||
    lower.includes("uva")
  )
    return "food-apple";
  if (
    lower.includes("verdura") ||
    lower.includes("alface") ||
    lower.includes("tomate") ||
    lower.includes("cebola") ||
    lower.includes("cenoura")
  )
    return "carrot";
  if (
    lower.includes("carne") ||
    lower.includes("frango") ||
    lower.includes("peixe") ||
    lower.includes("ovo")
  )
    return "food-drumstick";
  if (
    lower.includes("leite") ||
    lower.includes("queijo") ||
    lower.includes("iogurte") ||
    lower.includes("manteiga")
  )
    return "cow";
  if (
    lower.includes("pão") ||
    lower.includes("biscoito") ||
    lower.includes("bolo") ||
    lower.includes("torrada")
  )
    return "bread-slice";
  if (
    lower.includes("limpeza") ||
    lower.includes("detergente") ||
    lower.includes("sabão") ||
    lower.includes("alvejante")
  )
    return "spray-bottle";
  if (
    lower.includes("remédio") ||
    lower.includes("medicamento") ||
    lower.includes("farmácia")
  )
    return "pill";
  return "basket";
}

function getIconColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("fruta") || lower.includes("verdura")) return "#4CAF50";
  if (lower.includes("carne") || lower.includes("frango")) return "#FF5722";
  if (lower.includes("limpeza")) return "#2196F3";
  if (lower.includes("remédio")) return "#9C27B0";
  return "#FF9800";
}

export default function ShoppingItemCard({
  name,
  done,
  quantity,
  onToggle,
  onDelete,
  onEditQuantity,
  index = 0,
  error = false,
}: ShoppingItemCardProps) {
  const iconName = getItemIcon(name);
  const iconColor = done ? Colors.light.mutedText : getIconColor(name);
  const hasQty = !!quantity && quantity.trim().length > 0;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, translateX]);

  return (
    <Animated.View
      style={[
        styles.card,
        done && styles.cardDone,
        error && styles.cardError,
        { opacity, transform: [{ translateY }, { translateX }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        {done && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
      </TouchableOpacity>

      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: done
              ? Colors.light.cardDark
              : `${iconColor}20`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.name, done && styles.nameDone]}>{name}</Text>
        {hasQty && (
          <TouchableOpacity
            style={styles.qtyBadge}
            onPress={onEditQuantity}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="tag-outline"
              size={11}
              color={done ? Colors.light.mutedText : Colors.light.primary}
            />
            <Text
              style={[styles.qtyText, done && styles.qtyTextDone]}
              numberOfLines={1}
            >
              {quantity!.trim()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        {hasQty ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditQuantity}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={Colors.light.mutedText}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditQuantity}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="tag-plus-outline"
              size={18}
              color={Colors.light.mutedText}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={Colors.light.mutedText}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDone: {
    opacity: 0.7,
  },
  cardError: {
    borderLeftColor: Colors.light.danger,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  nameDone: {
    textDecorationLine: "line-through",
    color: Colors.light.mutedText,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  qtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.light.accentPurpleSurface,
    maxWidth: "100%",
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  qtyTextDone: {
    color: Colors.light.mutedText,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editBtn: {
    padding: 6,
  },
  deleteBtn: {
    padding: 6,
  },
});
