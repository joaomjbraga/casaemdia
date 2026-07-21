import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface CheckableListItemProps {
  done: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function CheckableListItem({
  done,
  onToggle,
  title,
  subtitle,
  leftContent,
  rightContent,
  disabled = false,
  style,
}: CheckableListItemProps) {
  return (
    <View style={[styles.row, style]}>
      {leftContent}

      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {done && <ZappIcon name="check" size={16} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
  },
});
