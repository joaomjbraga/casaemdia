import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface StatItem {
  icon: string;
  iconColor: string;
  value: string | number;
  label: string;
  valueColor?: string;
}

interface StatRowProps {
  stats: StatItem[];
  onPress?: (index: number) => void;
  style?: ViewStyle;
}

export default function StatRow({ stats, onPress, style }: StatRowProps) {
  return (
    <View style={[styles.row, style]}>
      {stats.map((stat, index) => {
        const content = (
          <View key={index} style={styles.stat}>
            <ZappIcon name={stat.icon} size={16} color={stat.iconColor} />
            <Text style={[styles.value, stat.valueColor ? { color: stat.valueColor } : undefined]}>
              {stat.value}
            </Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        );

        return (
          <React.Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {onPress ? (
              <TouchableOpacity
                style={styles.stat}
                onPress={() => onPress(index)}
                activeOpacity={0.7}
              >
                {content}
              </TouchableOpacity>
            ) : (
              content
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.border,
  },
});
