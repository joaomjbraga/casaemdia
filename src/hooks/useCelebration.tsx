import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CELEBRATION_SOUND = require("@/assets/audio/celebration.wav");

interface CelebrationPiece {
  id: number;
  left: number;
  emoji: string;
  delay: number;
  duration: number;
  size: number;
}

const EMOJIS = ["🎉", "✨", "🎊", "⭐", "💫", "🏆"];

const buildPieces = (): CelebrationPiece[] =>
  Array.from({ length: 24 }, (_, id) => ({
    id,
    left: Math.random() * (SCREEN_WIDTH - 40) + 20,
    emoji: EMOJIS[id % EMOJIS.length],
    delay: Math.random() * 300,
    duration: 1400 + Math.random() * 800,
    size: 18 + Math.random() * 18,
  }));

/**
 * Hook de comemoração: toca um áudio e exibe uma animação de confete quando
 * todas as tarefas ou compras de uma lista forem concluídas.
 *
 * O disparo é feito manualmente via `celebrate()` (chamado no momento em que
 * a última tarefa/item é marcado como concluído), evitando que o efeito toque
 * ao abrir a tela com a lista já finalizada.
 */
export function useCelebration() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<CelebrationPiece[]>([]);

  useEffect(() => {
    try {
      playerRef.current = createAudioPlayer(CELEBRATION_SOUND);
    } catch (error) {
      console.warn("[Celebration] Erro ao carregar som:", error);
    }
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    } catch {
      // non-blocking
    }
  }, []);

  const celebrate = useCallback(() => {
    playSound();
    setPieces(buildPieces());
    setVisible(true);
  }, [playSound]);

  const dismiss = useCallback(() => setVisible(false), []);

  const CelebrationOverlay = useCallback(
    () => (
      <Pressable
        style={styles.overlay}
        onPress={dismiss}
        pointerEvents={visible ? "auto" : "none"}
      >
        {visible &&
          pieces.map((piece) => (
            <FallingPiece key={piece.id} piece={piece} onDone={dismiss} />
          ))}

        {visible && (
          <Animated.View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🏆</Text>
            <Text style={styles.badgeText}>Tudo concluído!</Text>
          </Animated.View>
        )}
      </Pressable>
    ),
    [visible, pieces, dismiss],
  );

  return { celebrate, CelebrationOverlay };
}

function FallingPiece({
  piece,
  onDone,
}: {
  piece: CelebrationPiece;
  onDone: () => void;
}) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const finish = setTimeout(onDone, piece.delay + piece.duration + 200);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: Dimensions.get("window").height + 40,
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
    return () => clearTimeout(finish);
  }, [piece, translateY, opacity, rotate, onDone]);

  return (
    <Animated.Text
      style={[
        styles.piece,
        {
          left: piece.left,
          fontSize: piece.size,
          opacity,
          transform: [
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        },
      ]}
    >
      {piece.emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  piece: {
    position: "absolute",
    top: 0,
  },
  badge: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  badgeEmoji: {
    fontSize: 64,
  },
  badgeText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
