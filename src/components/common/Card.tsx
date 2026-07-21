import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Shadows } from '@/constants/Colors';

interface CardProps {
  variant?: 'outlined' | 'elevated' | 'flat';
  padding?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function Card({ variant = 'outlined', padding = 14, style, children }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  elevated: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.md,
  },
});
