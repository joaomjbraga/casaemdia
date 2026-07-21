import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import XPBadge from '@/components/common/XPBadge';
import Colors from '@/constants/Colors';

interface DashboardTaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  index?: number;
  taskId?: string;
  onPress?: (taskId: string) => void;
}

export default function DashboardTaskCard({
  title,
  done,
  assignee,
  points,
  index = 0,
  taskId,
  onPress,
}: DashboardTaskCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) {
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 10,
          stiffness: 200,
          mass: 0.6,
        }),
        Animated.spring(checkScale, {
          toValue: 1.15,
          useNativeDriver: true,
          damping: 8,
          stiffness: 300,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 200,
        }),
      ]).start();
    }
  }, [done, checkScale]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePress = () => {
    if (taskId && onPress) {
      onPress(taskId);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }], opacity, translateY }]}>
        <View style={styles.checkCircle}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <ZappIcon name="check" size={16} color="#fff" />
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.meta}>
            <ZappIcon name="account-outline" size={12} color={Colors.light.mutedText} />
            <Text style={styles.metaText}>{assignee}</Text>
          </View>
        </View>

        <XPBadge points={points} size="sm" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(88, 204, 2, 0.2)',
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 3,
    lineHeight: 18,
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.light.mutedText,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.12)',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
