import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
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
}

export default function EmptyState({
  iconName,
  title,
  subtitle,
  iconSize = 32,
  iconColor = Colors.light.primary,
  iconBackgroundColor = Colors.light.accentPurpleSurface,
  containerStyle,
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.mutedText,
    textAlign: "center",
  },
});
