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

interface TaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  onToggle: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  index?: number;
  error?: boolean;
}

export default function TaskCard({
  title,
  done,
  assignee,
  points,
  onToggle,
  onDelete,
  isLoading,
  index = 0,
  error = false,
}: TaskCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 220,
          mass: 0.8,
        }),
      ]).start();
    }
  }, [done, scale]);

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
        { transform: [{ scale }, { translateX }], opacity, translateY },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {done && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[styles.title, done && styles.titleDone]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="account-outline"
              size={14}
              color={Colors.light.mutedText}
            />
            <Text style={styles.metaText}>{assignee}</Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="star"
              size={14}
              color={Colors.light.primary}
            />
            <Text style={[styles.metaText, { color: Colors.light.primary }]}>
              {points}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons
          name="close"
          size={16}
          color={Colors.light.mutedText}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDone: {
    borderLeftColor: Colors.light.success,
    opacity: 0.75,
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 7,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.light.mutedText,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.mutedText,
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
    opacity: 0.6,
  },
});
