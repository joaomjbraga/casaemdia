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
  default: { bg: Colors.light.cardDark, text: Colors.light.mutedText },
  success: { bg: 'rgba(88, 204, 2, 0.12)', text: Colors.light.success },
  warning: { bg: 'rgba(255, 149, 0, 0.12)', text: Colors.light.warning },
  danger: { bg: 'rgba(255, 59, 48, 0.12)', text: Colors.light.danger },
  purple: { bg: Colors.light.accentPurpleSurface, text: Colors.light.accentPurple },
  primary: { bg: 'rgba(0, 122, 255, 0.08)', text: Colors.light.primary },
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
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 13,
  },
});
