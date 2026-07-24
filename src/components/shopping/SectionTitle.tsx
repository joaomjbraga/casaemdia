import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Colors from '@/constants/Colors';

interface SectionTitleProps {
  label: string;
  color?: string;
  uppercase?: boolean;
  fontSize?: number;
  fontWeight?:
    'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: number;
  style?: any;
}

export default function SectionTitle({
  label,
  color = Colors.light.primary,
  uppercase = true,
  fontSize = 13,
  fontWeight = '700',
  letterSpacing = 0.8,
  style,
}: SectionTitleProps) {
  return (
    <Text
      style={[
        styles.title,
        { color, fontSize, fontWeight, letterSpacing },
        uppercase && styles.uppercase,
        style,
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {},
  uppercase: {
    textTransform: 'uppercase',
  },
});
