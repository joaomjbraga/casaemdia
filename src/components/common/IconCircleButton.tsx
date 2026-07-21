import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
      mass: 0.6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
      mass: 0.6,
    }).start();
  };

  const iconSize = size * 0.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size * 0.5,
            backgroundColor,
            borderColor,
            transform: [{ scale }],
          },
          disabled && styles.disabled,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize}
          color={iconColor}
        />
      </Animated.View>
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
