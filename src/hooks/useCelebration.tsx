import Colors from '@/constants/Colors';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/lib/logger';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text } from 'react-native';

const SCREEN = Dimensions.get('window');

const CELEBRATION_SOUND = require('@/assets/audio/celebration.wav');

interface CelebrationPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: 'circle' | 'square' | 'star';
}

const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96E6A1',
  '#DDA0DD',
  '#FF9500',
  '#007AFF',
];
const SHAPES: Array<'circle' | 'square' | 'star'> = ['circle', 'square', 'star'];

const buildPieces = (): CelebrationPiece[] =>
  Array.from({ length: 40 }, (_, id) => ({
    id,
    left: Math.random() * (SCREEN.width - 20) + 10,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    delay: Math.random() * 600,
    duration: 2600 + Math.random() * 1200,
    size: 6 + Math.random() * 10,
    shape: SHAPES[id % SHAPES.length],
  }));

const OVERLAY_DURATION = 4200;

export function useCelebration() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<CelebrationPiece[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      playerRef.current = createAudioPlayer(CELEBRATION_SOUND);
    } catch (error) {
      logger.warn('[Celebration] Erro ao carregar som:', error);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      playerRef.current?.remove();
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      } else {
        logger.warn('[Celebration] Player de audio indisponível');
      }
    } catch (error) {
      logger.warn('[Celebration] Erro ao tocar som:', error);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
  }, []);

  const celebrate = useCallback(() => {
    logger.info('[Celebration] Disparando comemoração');
    playSound();
    setPieces(buildPieces());
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), OVERLAY_DURATION);
  }, [playSound]);

  const CelebrationOverlay = useCallback(
    () =>
      visible ? (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <Pressable style={styles.overlay} onPress={dismiss} pointerEvents="auto">
            {pieces.map((piece) => (
              <FallingPiece key={piece.id} piece={piece} />
            ))}

            <Animated.View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgeText}>Tudo concluído!</Text>
            </Animated.View>
          </Pressable>
        </Modal>
      ) : null,
    [visible, pieces, dismiss],
  );

  return { celebrate, CelebrationOverlay };
}

function FallingPiece({ piece }: { piece: CelebrationPiece }) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN.height + 40,
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

  const borderRadius = piece.shape === 'circle' ? piece.size / 2 : piece.shape === 'square' ? 2 : 0;

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.left,
          width: piece.size,
          height: piece.size,
          borderRadius,
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
  badge: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 64,
  },
  badgeText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
