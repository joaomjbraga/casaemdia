import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useNotificationStatus } from "@/hooks/useNotificationStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconCircleButton from "@/components/common/IconCircleButton";
import Avatar from "@/components/common/Avatar";

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
  const { top: statusBarHeight } = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(Colors.light.backgroundSecondary);
    }
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

  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const membersCount = members?.length ?? 0;

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
            size={40}
            borderRadius={12}
            borderColor={Colors.light.border}
            backgroundColor={Colors.light.cardDark}
            iconName="account"
            iconColor={Colors.light.primary}
            iconSize={20}
          />
          <View style={styles.appTitleContainer}>
            <Text style={styles.appName} numberOfLines={1}>
              {familyName || "Casa em Dia"}
            </Text>
            <Text style={styles.appSubtitle}>
              {membersCount} {membersCount === 1 ? "membro" : "membros"}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <IconCircleButton
            iconName="cog-outline"
            onPress={handleOpenSettings}
            iconColor={Colors.light.primary}
            size={36}
            backgroundColor={Colors.light.cardDark}
            borderColor={Colors.light.border}
          />

          <IconCircleButton
            iconName="logout-variant"
            onPress={handleLogout}
            disabled={isLoggingOut}
            iconColor={Colors.light.danger}
            size={36}
            backgroundColor={Colors.light.cardDark}
            borderColor={Colors.light.border}
          />
        </View>
      </View>

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
              color={Colors.light.warning}
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
            color={Colors.light.mutedText}
          />
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={16}
            color={Colors.light.primary}
          />
          <Text style={styles.statValue}>{pendingTasks}</Text>
          <Text style={styles.statText}>a fazer</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={16}
            color={Colors.light.success}
          />
          <Text style={styles.statValue}>{completedTasks}</Text>
          <Text style={styles.statText}>feitas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  statusBarSpacer: {
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 56,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    color: Colors.light.text,
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
    backgroundColor: Colors.light.border,
    marginHorizontal: 3,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.mutedText,
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
    backgroundColor: "rgba(255, 149, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.15)",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
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
    color: Colors.light.warning,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  alertHint: {
    fontSize: 11.5,
    fontWeight: "500",
    color: Colors.light.mutedText,
    lineHeight: 15,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 24,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.light.border,
    marginHorizontal: 6,
  },
  statText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.mutedText,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
