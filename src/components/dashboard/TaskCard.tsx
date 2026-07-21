import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface DashboardTaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  index?: number;
}

export default function DashboardTaskCard({
  title,
  done,
  assignee,
  points,
  index = 0,
}: DashboardTaskCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

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

  return (
    <Animated.View
      style={[
        styles.card,
        done && styles.cardDone,
        { transform: [{ scale }], opacity, translateY },
      ]}
    >
      <View style={styles.readOnlyIndicator} />

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
  },
  cardDone: {
    borderLeftColor: Colors.light.success,
    opacity: 0.75,
  },
  readOnlyIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: 12,
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
});
