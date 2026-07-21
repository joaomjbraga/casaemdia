import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import Badge from '@/components/common/Badge';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface SectionHeaderProps {
  icon?: string;
  iconColor?: string;
  title: string;
  badge?: number;
  badgeColor?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'primary';
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export default function SectionHeader({
  icon,
  iconColor = Colors.light.mutedText,
  title,
  badge,
  badgeColor = 'default',
  rightContent,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      {icon && <ZappIcon name={icon} size={18} color={iconColor} />}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {badge !== undefined && <Badge label={String(badge)} variant={badgeColor} size="sm" />}
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
