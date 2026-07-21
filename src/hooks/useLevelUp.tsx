import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/Colors";

interface LevelUpOverlayProps {
  level: number;
  visible: boolean;
  onDismiss: () => void;
}

export function useLevelUp() {
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLevelUp = useCallback((newLevel: number) => {
    setLevel(newLevel);
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
  }, []);

  const LevelUpOverlay = useCallback(
    () =>
      visible ? (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={styles.overlay}>
            <LevelUpBadge level={level} />
          </View>
        </Modal>
      ) : null,
    [visible, level],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return { showLevelUp, LevelUpOverlay };
}

function LevelUpBadge({ level }: { level: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          transform: [{ scale }],
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
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
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
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  level: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.mutedText,
    marginTop: 4,
  },
});
