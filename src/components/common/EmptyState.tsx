import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
  iconColor = Colors.light.mutedText,
  iconBackgroundColor = "rgba(255,255,255,0.06)",
  containerStyle,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize}
          color={iconColor}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.mutedText,
    textAlign: "center",
  },
});
