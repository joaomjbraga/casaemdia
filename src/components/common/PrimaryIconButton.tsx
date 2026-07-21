import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface PrimaryIconButtonProps {
  iconName: string;
  onPress: () => void;
  size?: number;
  color?: string;
  shadowColor?: string;
  disabled?: boolean;
  style?: any;
}

export default function PrimaryIconButton({
  iconName,
  onPress,
  size = 44,
  color = Colors.light.primary,
  shadowColor = Colors.light.primary,
  disabled = false,
  style,
}: PrimaryIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: color,
          shadowColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName as any}
        size={size * 0.5}
        color={Colors.light.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
