import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

interface PrimaryActionButtonProps {
  title: string;
  icon?: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function PrimaryActionButton({
  title,
  icon,
  onPress,
  color = Colors.light.primary,
  disabled = false,
  loading = false,
  style,
}: PrimaryActionButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }, isDisabled && styles.btnDisabled, style]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {icon && <ZappIcon name={icon} size={17} color="#fff" />}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.1,
  },
});
