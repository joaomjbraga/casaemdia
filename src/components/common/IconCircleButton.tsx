import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface IconCircleButtonProps {
  iconName: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  disabled?: boolean;
  style?: any;
}

export default function IconCircleButton({
  iconName,
  onPress,
  size = 40,
  backgroundColor = "rgba(255,255,255,0.06)",
  borderColor = "rgba(255,255,255,0.08)",
  iconColor = Colors.light.text,
  disabled = false,
  style,
}: IconCircleButtonProps) {
  const iconSize = size * 0.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size * 0.5,
          backgroundColor,
          borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName as any}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
