import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'tasks' | 'shopping';
}

const SkeletonBlock = ({ style, opacity }: { style?: object; opacity: Animated.Value }) => {
  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        style,
        {
          opacity,
        },
      ]}
    />
  );
};

export default function LoadingSkeleton({ variant = 'dashboard' }: LoadingSkeletonProps) {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {variant === 'dashboard' ? (
          <>
            <SkeletonBlock style={styles.header} opacity={opacity} />
            <SkeletonBlock style={styles.smallCard} opacity={opacity} />
            <SkeletonBlock style={styles.card} opacity={opacity} />
            <SkeletonBlock style={styles.card} opacity={opacity} />
          </>
        ) : variant === 'shopping' ? (
          <>
            <SkeletonBlock style={styles.header} opacity={opacity} />
            <SkeletonBlock style={styles.searchBar} opacity={opacity} />
            <SkeletonBlock style={styles.itemCard} opacity={opacity} />
            <SkeletonBlock style={styles.itemCard} opacity={opacity} />
          </>
        ) : (
          <>
            <SkeletonBlock style={styles.header} opacity={opacity} />
            <SkeletonBlock style={styles.itemCard} opacity={opacity} />
            <SkeletonBlock style={styles.itemCard} opacity={opacity} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 14,
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
