import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterToggleGroupProps {
  options: FilterOption[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export default function FilterToggleGroup({
  options,
  activeKey,
  onChange,
  style,
}: FilterToggleGroupProps) {
  return (
    <View style={[styles.row, style]}>
      {options.map((option) => {
        const isActive = option.key === activeKey;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.btn, isActive && styles.btnActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  btnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  textActive: {
    color: '#fff',
  },
});
