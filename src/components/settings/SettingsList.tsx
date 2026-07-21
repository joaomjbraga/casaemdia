import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/Colors';

export function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export function ListSection({ children }: { children: React.ReactNode }) {
  return <View style={styles.listSection}>{children}</View>;
}

export function Cell({
  children,
  first,
  last,
  onPress,
  chevron,
  disabled,
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  onPress?: () => void;
  chevron?: boolean;
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.cell,
        first && styles.cellFirst,
        last && styles.cellLast,
        onPress && styles.cellPressable,
        disabled && styles.cellDisabled,
      ]}
    >
      <TouchableOpacity
        style={styles.cellTouch}
        onPress={onPress}
        disabled={!onPress || disabled}
        activeOpacity={0.6}
      >
        <View style={[styles.cellInner, last && styles.cellInnerLast]}>
          {children}
          {chevron && (
            <ZappIcon
              name="chevron-right"
              size={20}
              color={Colors.light.mutedText}
              style={styles.cellChevron}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 8,
  },
  listSection: {
    marginHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cell: {
    backgroundColor: 'transparent',
  },
  cellPressable: {},
  cellDisabled: { opacity: 0.5 },
  cellFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cellLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cellTouch: { flex: 1 },
  cellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  cellInnerLast: {
    borderBottomWidth: 0,
  },
  cellChevron: { marginLeft: 'auto' },
});
