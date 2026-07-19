import React, { useState, useCallback, createContext, useContext } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type DialogType = "confirm" | "danger" | "success" | "error";

interface DialogConfig {
  title: string;
  message?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface ConfirmDialogContextType {
  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(
  undefined
);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({ title: "" });
  const [loading, setLoading] = useState(false);

  const showDialog = useCallback((dialogConfig: DialogConfig) => {
    setConfig(dialogConfig);
    setVisible(true);
    setLoading(false);
  }, []);

  const hideDialog = useCallback(() => {
    setVisible(false);
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (config.onConfirm) {
      setLoading(true);
      try {
        await config.onConfirm();
      } catch (e) {
        // error handled by caller
      } finally {
        setLoading(false);
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [config.onConfirm]);

  const handleCancel = useCallback(() => {
    config.onCancel?.();
    setVisible(false);
    setLoading(false);
  }, [config.onCancel]);

  const typeConfig = {
    confirm: { icon: "help-circle-outline" as const, color: "#A259FF", bgColor: "rgba(162, 89, 255, 0.12)" },
    danger: { icon: "alert-circle-outline" as const, color: "#F44336", bgColor: "rgba(244, 67, 54, 0.12)" },
    success: { icon: "check-circle-outline" as const, color: "#4CAF50", bgColor: "rgba(76, 175, 80, 0.12)" },
    error: { icon: "close-circle-outline" as const, color: "#F44336", bgColor: "rgba(244, 67, 54, 0.12)" },
  };

  const current = typeConfig[config.type || "confirm"];

  return (
    <ConfirmDialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideDialog}>
        <Pressable style={styles.backdrop} onPress={hideDialog}>
          <Pressable style={styles.dialogContent} onPress={() => {}}>
            <View style={[styles.iconCircle, { backgroundColor: current.bgColor }]}>
              <MaterialCommunityIcons name={current.icon} size={36} color={current.color} />
            </View>

            <Text style={styles.title}>{config.title}</Text>
            {config.message && (
              <Text style={styles.message}>{config.message}</Text>
            )}

            <View style={styles.actions}>
              {config.showCancel !== false && (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.cancelBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>
                    {config.cancelText || "Cancelar"}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  config.type === "danger" || config.type === "error"
                    ? styles.dangerBtn
                    : config.type === "success"
                    ? styles.successBtn
                    : styles.confirmBtn,
                  loading && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.confirmText}>
                  {loading ? "Aguarde..." : config.confirmText || "Confirmar"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  dialogContent: {
    backgroundColor: "#161B22",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#8B949E",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    backgroundColor: "#21262D",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmBtn: {
    backgroundColor: "#A259FF",
  },
  dangerBtn: {
    backgroundColor: "#F44336",
  },
  successBtn: {
    backgroundColor: "#4CAF50",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  btnPressed: {
    opacity: 0.8,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
});
