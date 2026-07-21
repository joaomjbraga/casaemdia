import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface BackHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export default function BackHeader({ title, onBack, rightContent, style }: BackHeaderProps) {
  const { top } = useSafeAreaInsets();

  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: top }, style]}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ZappIcon name="chevron-left" size={24} color={Colors.light.text} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}

      {rightContent ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  titleSpacer: {
    flex: 1,
  },
  spacer: {
    width: 60,
  },
});
