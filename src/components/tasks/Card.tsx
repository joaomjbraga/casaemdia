import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface CardProps {
  variant?: 'outlined' | 'elevated' | 'flat';
  padding?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function Card({ variant = 'outlined', padding = 16, style, children }: CardProps) {
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
    borderRadius: 12,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  elevated: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});
