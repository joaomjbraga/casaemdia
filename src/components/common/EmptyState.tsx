import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';

interface EmptyStateProps {
  iconName: string;
  title: string;
  subtitle: string;
  iconSize?: number;
  iconColor?: string;
  iconBackgroundColor?: string;
  containerStyle?: any;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  iconName,
  title,
  subtitle,
  iconSize = 40,
  iconColor = Colors.light.mutedText,
  iconBackgroundColor = '#F1F5F9',
  containerStyle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[styles.container, containerStyle, { opacity, translateY }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <ZappIcon name={iconName} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.6}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.mutedText,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.1,
  },
});
