import { useCallback, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
      mass: 0.6,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
      mass: 0.6,
    }).start();
  }, [scale]);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const iconSize = size * 0.5;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.85}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      // @ts-ignore
      android_ripple={{
        color: "rgba(0, 0, 0, 0.08)",
        borderless: true,
      }}
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
