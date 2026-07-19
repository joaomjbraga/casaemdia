import Aurora from "@/components/shared/ui/aurora";
import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import IconCircleButton from "./common/IconCircleButton";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const { signOut } = useAuth();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

  const colors = Colors.light;

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = useCallback(() => {
    showDialog({
      title: "Sair da conta",
      message: "Tem certeza que deseja sair?",
      type: "danger",
      confirmText: "Sair",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await signOut();
          router.replace("/(auth)/login");
        } catch (error) {
          showAlert({
            title: "Erro",
            message: "Não foi possível sair da conta. Tente novamente.",
            type: "error",
          });
        }
      },
    });
  }, [signOut, showDialog, showAlert, router]);

  const handleOpenSettings = useCallback(() => {
    router.push("/_settings");
  }, [router]);

  const getTimeOfDay = useCallback(() => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Bom dia",
        icon: "weather-sunny" as const,
        period: "manhã",
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: "Boa tarde",
        icon: "weather-partly-cloudy" as const,
        period: "tarde",
      };
    } else {
      return {
        greeting: "Boa noite",
        icon: "weather-night" as const,
        period: "noite",
      };
    }
  }, [currentTime]);

  const getFamilyName = useCallback((): string => {
    const userName = user?.displayName || "Familia";
    return `${userName}`;
  }, [user?.displayName]);

  const getCurrentTime = useCallback((): string => {
    return currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [currentTime]);

  const timeInfo = useMemo(() => getTimeOfDay(), [getTimeOfDay]);

  const slideInterpolate = useMemo(
    () =>
      slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-30, 0],
      }),
    [slideAnim],
  );

  const statusBarHeight = useMemo(() => {
    return StatusBar.currentHeight || 24;
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      <View style={styles.auroraWrapper}>
        <Aurora
          height={320}
          auroraColors={["#00FF87", "#60EFFF", "#A259FF"]}
          skyColors={["#0a0e1a", "#0D1B2A"]}
          speed={0.35}
          intensity={0.7}
          waveDirection={[5, -5]}
        />
      </View>

      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideInterpolate }],
          },
        ]}
      >
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="home-variant"
              size={22}
              color="#00FF87"
            />
          </View>
          <View style={styles.appTitleContainer}>
            <Text style={styles.appName}>Casa em Dia</Text>
            <Text style={styles.appSubtitle}>Organização Familiar</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <IconCircleButton
            iconName="logout-variant"
            onPress={handleLogout}
            disabled={isLoggingOut}
            iconColor="rgba(96, 239, 255, 0.8)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.06)"
            borderColor="rgba(96, 239, 255, 0.15)"
          />

          <IconCircleButton
            iconName="cog-outline"
            onPress={handleOpenSettings}
            iconColor="rgba(96, 239, 255, 0.8)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.06)"
            borderColor="rgba(96, 239, 255, 0.15)"
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.greetingCard, { opacity: fadeAnim }]}>
        <View style={styles.greetingContent}>
          <View style={styles.greetingLeft}>
            <View style={styles.timeIcon}>
              <MaterialCommunityIcons
                name={timeInfo.icon}
                size={22}
                color="#00FF87"
              />
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>
                {timeInfo.greeting}, {getFamilyName()}
              </Text>
              <Text style={styles.period}>{timeInfo.period}</Text>
            </View>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={14}
              color="#00FF87"
            />
            <Text style={styles.statText}>Tarefas</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="account-group"
              size={14}
              color="#60EFFF"
            />
            <Text style={styles.statText}>Família</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="home-heart"
              size={14}
              color="#A259FF"
            />
            <Text style={styles.statText}>Casa</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  statusBarSpacer: {},
  auroraWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 340,
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 14, 26, 0.35)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginBottom: 20,
    minHeight: 44,
  },
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 135, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 135, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  appTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 1,
    textShadowColor: "rgba(0, 255, 135, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.7)",
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  greetingCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(13, 27, 42, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.12)",
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    minHeight: 48,
  },
  greetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  timeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0, 255, 135, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 135, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  greetingText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  period: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.65)",
    textTransform: "capitalize",
  },
  timeDisplay: {
    alignItems: "flex-end",
    flexShrink: 0,
    backgroundColor: "rgba(162, 89, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(162, 89, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  currentTime: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(96, 239, 255, 0.08)",
    minHeight: 36,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 24,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(96, 239, 255, 0.1)",
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.2,
  },
});
