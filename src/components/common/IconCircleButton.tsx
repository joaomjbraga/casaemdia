import { usePressOpacity } from '@/hooks/usePressAnimation';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';

interface IconCircleButtonProps {
  iconName: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  disabled?: boolean;
  style?: object;
}

export default function IconCircleButton({
  iconName,
  onPress,
  size = 40,
  backgroundColor = 'rgba(0,147,148,0.08)',
  borderColor = 'rgba(0,147,148,0.12)',
  iconColor = Colors.light.primary,
  disabled = false,
  style,
}: IconCircleButtonProps) {
  const { opacity, handlePressIn, handlePressOut } = usePressOpacity({ pressedValue: 0.55 });
  const iconSize = Math.round(size * 0.45);

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
            backgroundColor,
            borderColor,
            opacity,
          },
          disabled && styles.disabled,
        ]}
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.35,
  },
});
