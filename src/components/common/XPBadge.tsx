import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface XPBadgeProps {
  points: number;
  size?: 'sm' | 'md';
  variant?: 'default' | 'done';
  style?: ViewStyle;
}

export default function XPBadge({ points, size = 'sm', variant = 'default', style }: XPBadgeProps) {
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 14;
  const iconColor = variant === 'done' ? Colors.light.success : Colors.light.primary;

  return (
    <View
      style={[
        styles.badge,
        isSm ? styles.badgeSm : styles.badgeMd,
        variant === 'done' && styles.badgeDone,
        style,
      ]}
    >
      <ZappIcon name={variant === 'done' ? 'check' : 'star'} size={iconSize} color={iconColor} />
      <Text style={[styles.text, isSm ? styles.textSm : styles.textMd, { color: iconColor }]}>
        {points} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  badgeDone: {
    backgroundColor: 'rgba(88, 204, 2, 0.12)',
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 14,
  },
});
