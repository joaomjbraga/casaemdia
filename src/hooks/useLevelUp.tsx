import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/Colors';

const SCREEN = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'];

const buildConfetti = (): ConfettiPiece[] =>
  Array.from({ length: 24 }, (_, id) => ({
    id,
    left: Math.random() * (SCREEN.width - 20) + 10,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    delay: Math.random() * 400,
    duration: 1800 + Math.random() * 800,
    size: 6 + Math.random() * 8,
  }));

interface LevelUpOverlayProps {
  level: number;
  visible: boolean;
  onDismiss: () => void;
}

export function useLevelUp() {
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState(1);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLevelUp = useCallback((newLevel: number) => {
    setLevel(newLevel);
    setConfetti(buildConfetti());
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
  }, []);

  const LevelUpOverlay = useCallback(
    () =>
      visible ? (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <Pressable style={styles.overlay} onPress={dismiss}>
            {confetti.map((piece) => (
              <ConfettiDrop key={piece.id} piece={piece} />
            ))}
            <LevelUpBadge level={level} />
          </Pressable>
        </Modal>
      ) : null,
    [visible, level, confetti, dismiss],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return { showLevelUp, LevelUpOverlay };
}

function ConfettiDrop({ piece }: { piece: ConfettiPiece }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN.height + 20,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [piece, translateY, opacity, rotate]);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: piece.left,
          width: piece.size,
          height: piece.size,
          borderRadius: piece.size / 2,
          backgroundColor: piece.color,
          opacity,
          transform: [
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function LevelUpBadge({ level }: { level: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
        mass: 0.8,
      }),
    ]).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scale, opacity, pulseScale]);

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          transform: [{ scale: Animated.multiply(scale, pulseScale) }],
          opacity,
        },
      ]}
    >
      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.label}>Level Up!</Text>
      <Text style={styles.level}>Nível {level}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  badge: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  level: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.mutedText,
    marginTop: 4,
  },
});
