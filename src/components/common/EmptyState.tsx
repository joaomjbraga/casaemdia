import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface EmptyStateProps {
  iconName: string;
  title: string;
  subtitle: string;
  iconSize?: number;
  iconColor?: string;
  iconBackgroundColor?: string;
  containerStyle?: any;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  iconName,
  title,
  subtitle,
  iconSize = 40,
  iconColor = Colors.light.primary,
  iconBackgroundColor = Colors.light.accentPurpleSurface,
  containerStyle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
        mass: 0.8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View style={[styles.container, containerStyle, { opacity, transform: [{ scale }] }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize}
          color={iconColor}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.mutedText,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.textWhite,
    letterSpacing: -0.2,
  },
});
