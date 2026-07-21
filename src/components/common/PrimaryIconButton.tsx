import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
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
            borderRadius: size * 0.32,
            backgroundColor: color,
            shadowColor,
            transform: [{ scale }],
          },
          disabled && styles.disabled,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={size * 0.5}
          color={Colors.light.text}
        />
      </Animated.View>
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
