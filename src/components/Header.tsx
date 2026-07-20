import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useNotificationStatus } from "@/hooks/useNotificationStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import IconCircleButton from "./common/IconCircleButton";
import Avatar from "./common/Avatar";

interface HeaderProps {
  /** Total de tarefas cadastradas na família. */
  totalTasks?: number;
  /** Total de tarefas concluídas. */
  completedTasks?: number;
}

export default function Header({
  totalTasks = 0,
  completedTasks = 0,
}: HeaderProps) {
  const { user, signOut } = useAuth();
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

  useEffect(() => {
    // Atualiza periodicamente para a saudação (manhã/tarde/noite) e a data
    // acompanharem a passagem do tempo. Não há relógio, então 5 min basta.
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 300000);

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
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: "Boa tarde",
        icon: "weather-partly-cloudy" as const,
      };
    } else {
      return {
        greeting: "Boa noite",
        icon: "weather-night" as const,
      };
    }
  }, [currentTime]);

  const getFullDate = useCallback((): string => {
    const formatted = currentTime.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentTime]);

  const timeInfo = useMemo(() => getTimeOfDay(), [getTimeOfDay]);

  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const membersCount = members?.length ?? 0;

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

      <View style={styles.bar}>
        <View style={styles.brandSection}>
          <Avatar
            photoURL={user?.photoURL}
            size={46}
            borderRadius={14}
            borderColor="rgba(255, 255, 255, 0.12)"
            backgroundColor="rgba(255, 255, 255, 0.06)"
            iconName="account"
            iconColor="#FFFFFF"
            iconSize={24}
          />
          <View style={styles.appTitleContainer}>
            <Text style={styles.appName} numberOfLines={1}>
              {familyName || "Casa em Dia"}
            </Text>
            <View style={styles.subtitleRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={12}
                color="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.appSubtitle}>
                {membersCount} {membersCount === 1 ? "membro" : "membros"}
              </Text>
              <View style={styles.subtitleDot} />
              <MaterialCommunityIcons
                name={notificationsActive ? "bell-check" : "bell-off-outline"}
                size={12}
                color={notificationsActive ? "#30D158" : "#FF9F0A"}
              />
              <Text
                style={[
                  styles.appSubtitle,
                  {
                    color: notificationsActive
                      ? "rgba(48, 209, 88, 0.9)"
                      : "rgba(255, 159, 10, 0.9)",
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
            iconColor="rgba(255, 255, 255, 0.85)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.08)"
            borderColor="rgba(255, 255, 255, 0.12)"
          />

          <IconCircleButton
            iconName="logout-variant"
            onPress={handleLogout}
            disabled={isLoggingOut}
            iconColor="rgba(255, 255, 255, 0.85)"
            size={38}
            backgroundColor="rgba(255, 255, 255, 0.08)"
            borderColor="rgba(255, 255, 255, 0.12)"
          />
        </View>
      </View>

      <View style={styles.body}>
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
                color="#FF9F0A"
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
              color="rgba(255, 159, 10, 0.7)"
            />
          </TouchableOpacity>
        )}

        <View style={styles.greetingCard}>
          <View style={styles.greetingContent}>
            <View style={styles.greetingLeft}>
              <View style={styles.timeIcon}>
                <MaterialCommunityIcons
                  name={timeInfo.icon}
                  size={22}
                  color="#30D158"
                />
              </View>
              <View style={styles.greetingText}>
                <Text style={styles.greeting} numberOfLines={1}>
                  {timeInfo.greeting}
                </Text>
                <Text style={styles.period} numberOfLines={1}>
                  {getFullDate()}
                </Text>
              </View>
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
                color="#30D158"
              />
              <Text style={styles.statValue}>{completedTasks}</Text>
              <Text style={styles.statText}>feitas</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0B0B0F",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  statusBarSpacer: {
    backgroundColor: "#0B0B0F",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 64,
    backgroundColor: "#0B0B0F",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 12,
    marginRight: 12,
  },
  appTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 3,
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 3,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.55)",
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
    backgroundColor: "rgba(255, 159, 10, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 159, 10, 0.3)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 159, 10, 0.15)",
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
    color: "#FF9F0A",
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
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
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
