import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';

interface TaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  onToggle: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  index?: number;
  error?: boolean;
}

export default function TaskCard({
  title,
  done,
  assignee,
  onToggle,
  onDelete,
  isLoading,
  index = 0,
  error = false,
}: TaskCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(done ? 1 : 0)).current;
  const prevDone = useRef(done);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (done && !prevDone.current) {
      animation = Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 120,
      });
    } else if (!done) {
      animation = Animated.timing(checkScale, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      });
    }
    prevDone.current = done;
    animation?.start();
    return () => animation?.stop();
  }, [done, checkScale]);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 30,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: index * 30,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateY]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [error, translateX]);

  return (
    <Animated.View
      style={[
        styles.card,
        done && styles.cardDone,
        error && styles.cardError,
        { transform: [{ translateX }], opacity, translateY },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        disabled={isLoading}
        activeOpacity={0.6}
      >
        {done && (
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <ZappIcon name="check" size={14} color="#fff" />
          </Animated.View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <ZappIcon name="account-outline" size={12} color={Colors.light.mutedText} />
            <Text style={styles.metaText}>{assignee}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        activeOpacity={0.5}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ZappIcon name="close" size={14} color={Colors.light.mutedText} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardDone: {
    opacity: 0.6,
  },
  cardError: {
    borderColor: Colors.light.danger,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
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
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 19,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
    opacity: 0.5,
  },
});
