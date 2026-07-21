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

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      // @ts-ignore
      android_ripple={{
        color: "rgba(255, 255, 255, 0.2)",
        borderless: true,
      }}
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
