import { useCallback, useMemo, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';

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
  backgroundColor = 'rgba(255,255,255,0.06)',
  borderColor = 'rgba(255,255,255,0.08)',
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

  const animatedButtonStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size * 0.36,
      backgroundColor,
      borderColor,
      transform: [{ scale }],
      borderBottomWidth: Math.max(3, size * 0.08),
      borderBottomColor: 'rgba(0, 0, 0, 0.12)',
    }),
    [size, backgroundColor, borderColor, scale],
  );

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
        color: 'rgba(0, 0, 0, 0.08)',
        borderless: true,
      }}
    >
      <Animated.View
        style={[styles.button, styles.button3D, animatedButtonStyle, disabled && styles.disabled]}
      >
        <ZappIcon name={iconName} size={iconSize} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  button3D: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
