import Aurora from "@/components/shared/ui/aurora";
import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useNotificationStatus } from "@/hooks/useNotificationStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import IconCircleButton from "./common/IconCircleButton";

interface HeaderProps {
  user: User | null;
  /** Total de tarefas cadastradas na família. */
  totalTasks?: number;
  /** Total de tarefas concluídas. */
  completedTasks?: number;
}

export default function Header({
  user,
  totalTasks = 0,
  completedTasks = 0,
}: HeaderProps) {
  const { signOut } = useAuth();
  const { familyName, members } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const {
    status,
    pushEnabled,
    hasChip,
    noService,
    phonePermissionDenied,
    carrierName,
    requestPermission,
  } = useNotificationStatus();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

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
          setIsLoggingOut(true);
          await signOut();
          router.replace("/(auth)/login");
        } catch (error) {
          showAlert({
            title: "Erro",
            message: "Não foi possível sair da conta. Tente novamente.",
            type: "error",
          });
        } finally {
          setIsLoggingOut(false);
        }
      },
    });
  }, [signOut, showDialog, showAlert]);

  const handleOpenSettings = useCallback(() => {
    router.push("/_settings");
  }, []);

  const handleNotificationBanner = useCallback(async () => {
    // Só faz sentido pedir a permissão de push quando há chip confirmado.
    if (hasChip && !pushEnabled) {
      await requestPermission();
    }

    if (hasChip) {
      showAlert({
        title: "Ative as notificações",
        message:
          `Chip detectado${carrierName ? ` (${carrierName})` : ""}, mas as ` +
          "notificações estão desativadas.\n\n" +
          "Permita o envio de notificações nas configurações do sistema para " +
          "receber alertas de tarefas e compras da sua família.",
        type: "info",
        buttonText: "Entendi",
      });
      return;
    }

    if (noService) {
      showAlert({
        title: "Sem serviço de rede móvel",
        message:
          `Seu chip${carrierName ? ` (${carrierName})` : ""} está sem sinal ` +
          "(GSM indisponível).\n\n" +
          "Sem serviço de rede móvel, o dispositivo não recebe notificações " +
          "push do app. Verifique se:\n\n" +
          "1. O chip está inserido corretamente.\n" +
          "2. O modo avião está desligado.\n" +
          "3. Você está em uma área com cobertura.",
        type: "info",
        buttonText: "Entendi",
      });
      return;
    }

    if (phonePermissionDenied) {
      showAlert({
        title: "Não foi possível verificar o chip",
        message:
          "Precisamos da permissão de telefone para confirmar se há um chip " +
          "no dispositivo.\n\n" +
          "Conceda a permissão nas configurações do sistema e verifique se as " +
          "notificações estão ativas para receber alertas da sua família.",
        type: "info",
        buttonText: "Entendi",
      });
      return;
    }

    showAlert({
      title: "Chip não detectado",
      message:
        "Para receber alertas de tarefas e compras da sua família:\n\n" +
        "1. Insira um chip (SIM) no dispositivo.\n" +
        "2. Faça login na sua conta.\n" +
        "3. Permita o envio de notificações.\n\n" +
        "Sem um chip, o dispositivo não recebe notificações push do app.",
      type: "info",
      buttonText: "Entendi",
    });
  }, [hasChip, noService, phonePermissionDenied, pushEnabled, carrierName, requestPermission, showAlert]);

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

  const firstName = useMemo(() => {
    const name = user?.displayName || user?.email?.split("@")[0] || "Família";
    return name.split(" ")[0];
  }, [user?.displayName, user?.email]);

  const getFullDate = useCallback((): string => {
    const formatted = currentTime.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentTime]);

  const getCurrentTime = useCallback((): string => {
    return currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [currentTime]);

  const timeInfo = useMemo(() => getTimeOfDay(), [getTimeOfDay]);

  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const membersCount = members?.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const notificationsActive = status === "active" && pushEnabled && hasChip;
  const notificationsInactive = status === "inactive";

  // Texto compacto do status exibido junto ao nome da família.
  const statusLabel = notificationsActive
    ? "Ativo"
    : noService
      ? "Sem sinal"
      : phonePermissionDenied
        ? "Verificar"
        : !hasChip
          ? "Sem chip"
          : "Sem alertas";

  // Conteúdo do banner de aviso conforme o estado da detecção.
  const bannerContent = hasChip
    ? {
        icon: "bell-off-outline" as const,
        title: "Notificações desativadas",
        hint: "Permita as notificações para receber alertas de tarefas e compras. Toque para ativar.",
      }
    : noService
      ? {
          icon: "signal-off" as const,
          title: "Sem serviço de rede móvel",
          hint: "Seu chip está sem sinal (GSM indisponível). Sem serviço, o dispositivo não recebe notificações. Toque para saber mais.",
        }
      : phonePermissionDenied
        ? {
            icon: "sim-off-outline" as const,
            title: "Verifique o chip",
            hint: "Não foi possível confirmar o chip. Toque para conceder a permissão e ativar as notificações.",
          }
        : {
            icon: "sim-alert" as const,
            title: "Nenhum chip detectado",
            hint: "Insira um chip e faça login para receber alertas de tarefas e compras. Toque para saber como.",
          };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      <View style={styles.auroraWrapper}>
        <Aurora
          height={340}
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
            <Text style={styles.appName} numberOfLines={1}>
              {familyName || "Casa em Dia"}
            </Text>
            <View style={styles.subtitleRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={12}
                color="rgba(96, 239, 255, 0.7)"
              />
              <Text style={styles.appSubtitle}>
                {membersCount} {membersCount === 1 ? "membro" : "membros"}
              </Text>
              <View style={styles.subtitleDot} />
              <MaterialCommunityIcons
                name={notificationsActive ? "bell-check" : "bell-off-outline"}
                size={12}
                color={notificationsActive ? "#00FF87" : "#F5B542"}
              />
              <Text
                style={[
                  styles.appSubtitle,
                  {
                    color: notificationsActive
                      ? "rgba(0, 255, 135, 0.8)"
                      : "rgba(245, 181, 66, 0.9)",
                  },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <IconCircleButton
            iconName="cog-outline"
            onPress={handleOpenSettings}
            iconColor="rgba(96, 239, 255, 0.8)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.06)"
            borderColor="rgba(96, 239, 255, 0.15)"
          />

          <IconCircleButton
            iconName="logout-variant"
            onPress={handleLogout}
            disabled={isLoggingOut}
            iconColor="rgba(96, 239, 255, 0.8)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.06)"
            borderColor="rgba(96, 239, 255, 0.15)"
          />
        </View>
      </Animated.View>

      {notificationsInactive && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNotificationBanner}
          style={styles.alertBanner}
        >
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons
              name={bannerContent.icon}
              size={18}
              color="#F5B542"
            />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>{bannerContent.title}</Text>
            <Text style={styles.alertHint} numberOfLines={2}>
              {bannerContent.hint}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="rgba(245, 181, 66, 0.7)"
          />
        </TouchableOpacity>
      )}

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
              <Text style={styles.greeting} numberOfLines={1}>
                {timeInfo.greeting}, {firstName}
              </Text>
              <Text style={styles.period} numberOfLines={1}>
                {getFullDate()}
              </Text>
            </View>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={16}
              color="#60EFFF"
            />
            <Text style={styles.statValue}>{pendingTasks}</Text>
            <Text style={styles.statText}>a fazer</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color="#00FF87"
            />
            <Text style={styles.statValue}>{completedTasks}</Text>
            <Text style={styles.statText}>feitas</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="progress-check"
              size={16}
              color="#A259FF"
            />
            <Text style={styles.statValue}>{progress}%</Text>
            <Text style={styles.statText}>concluído</Text>
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
    height: 360,
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
    marginBottom: 16,
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
    marginBottom: 3,
    textShadowColor: "rgba(0, 255, 135, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtitleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(96, 239, 255, 0.4)",
    marginHorizontal: 3,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.7)",
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 181, 66, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 181, 66, 0.3)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(245, 181, 66, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  alertTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5B542",
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  alertHint: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.65)",
    lineHeight: 15,
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
    gap: 5,
    flex: 1,
    justifyContent: "center",
    minHeight: 24,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(96, 239, 255, 0.1)",
    marginHorizontal: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.1,
  },
});
