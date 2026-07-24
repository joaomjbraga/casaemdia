import Colors from '@/constants/Colors';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

interface SkeletonBlockProps {
  style?: ViewStyle;
}

export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.92,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.72,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        style,
        { opacity },
      ]}
    />
  );
}

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'tasks' | 'shopping';
}

export default function LoadingSkeleton({ variant = 'dashboard' }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {variant === 'dashboard' ? (
        <>
          <SkeletonBlock style={styles.header} />
          <SkeletonBlock style={styles.smallCard} />
          <SkeletonBlock style={styles.card} />
          <SkeletonBlock style={styles.card} />
        </>
      ) : variant === 'shopping' ? (
        <>
          <SkeletonBlock style={styles.header} />
          <SkeletonBlock style={styles.searchBar} />
          <SkeletonBlock style={styles.itemCard} />
          <SkeletonBlock style={styles.itemCard} />
        </>
      ) : (
        <>
          <SkeletonBlock style={styles.header} />
          <SkeletonBlock style={styles.itemCard} />
          <SkeletonBlock style={styles.itemCard} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 14,
    backgroundColor: Colors.light.background,
  },
  skeletonBlock: {
    borderRadius: 12,
    backgroundColor: Colors.light.cardDark,
  },
  header: {
    height: 92,
    width: '100%',
  },
  smallCard: {
    height: 82,
    width: '100%',
  },
  card: {
    height: 170,
    width: '100%',
  },
  searchBar: {
    height: 56,
    width: '100%',
  },
  itemCard: {
    height: 76,
    width: '100%',
  },
});
