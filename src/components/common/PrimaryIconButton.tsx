import { useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';

interface PrimaryIconButtonProps {
  iconName: string;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: any;
}

export default function PrimaryIconButton({
  iconName,
  onPress,
  size = 44,
  color = Colors.light.primary,
  disabled = false,
  style,
}: PrimaryIconButtonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: 0.6,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity,
          },
          disabled && styles.disabled,
        ]}
      >
        <ZappIcon name={iconName} size={Math.round(size * 0.48)} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  disabled: {
    opacity: 0.35,
  },
});
