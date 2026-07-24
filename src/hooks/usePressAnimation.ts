import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface PressAnimationOptions {
  pressedValue?: number;
  duration?: number;
  easing?: (value: number) => number;
}

export function usePressOpacity(options?: PressAnimationOptions) {
  const { pressedValue = 0.55, duration = 100, easing = Easing.out(Easing.quad) } = options ?? {};
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: pressedValue,
      duration,
      easing,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: duration + 50,
      easing,
      useNativeDriver: true,
    }).start();
  };

  return { opacity, handlePressIn, handlePressOut };
}

export function usePressScale(options?: PressAnimationOptions & { pressedValue?: number }) {
  const { pressedValue = 0.98, duration = 100, easing = Easing.out(Easing.quad) } = options ?? {};
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: pressedValue,
      duration,
      easing,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: duration + 40,
      easing,
      useNativeDriver: true,
    }).start();
  };

  return { scale, handlePressIn, handlePressOut };
}
