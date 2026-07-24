import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'primary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#F1F5F9', text: '#64748B' },
  success: { bg: 'rgba(22, 163, 74, 0.1)', text: '#16A34A' },
  warning: { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706' },
  danger: { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' },
  purple: { bg: 'rgba(18, 206, 200, 0.1)', text: '#12cec8' },
  primary: { bg: 'rgba(0, 147, 148, 0.08)', text: '#009394' },
};

export default function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <View
      style={[styles.badge, size === 'md' && styles.badgeMd, { backgroundColor: colors.bg }, style]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  textMd: {
    fontSize: 13,
  },
});
