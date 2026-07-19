import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type AlertDialogType = "success" | "error" | "info";

interface AlertDialogConfig {
  title: string;
  message?: string;
  type?: AlertDialogType;
  buttonText?: string;
  autoClose?: boolean;
  autoCloseMs?: number;
}

interface AlertDialogContextType {
  showAlert: (config: AlertDialogConfig) => void;
  hideAlert: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined
);

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return context;
};

export const AlertDialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertDialogConfig>({ title: "" });

  const showAlert = useCallback((alertConfig: AlertDialogConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible && config.autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, config.autoCloseMs || 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, config.autoClose, config.autoCloseMs]);

  const typeConfig = useMemo(() => ({
    success: { icon: "check-circle-outline" as const, color: "#4CAF50", bgColor: "rgba(76, 175, 80, 0.12)" },
    error: { icon: "close-circle-outline" as const, color: "#F44336", bgColor: "rgba(244, 67, 54, 0.12)" },
    info: { icon: "information-outline" as const, color: "#00C2FF", bgColor: "rgba(0, 194, 255, 0.12)" },
  }), []);

  const current = typeConfig[config.type || "success"];

  return (
    <AlertDialogContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <Pressable style={styles.backdrop} onPress={hideAlert}>
          <Pressable style={styles.dialogContent} onPress={() => {}}>
            <View style={[styles.iconCircle, { backgroundColor: current.bgColor }]}>
              <MaterialCommunityIcons name={current.icon} size={36} color={current.color} />
            </View>

            <Text style={styles.title}>{config.title}</Text>
            {config.message && (
              <Text style={styles.message}>{config.message}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: current.color },
                pressed && styles.btnPressed,
              ]}
              onPress={hideAlert}
            >
              <Text style={styles.btnText}>
                {config.buttonText || "OK"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertDialogContext.Provider>
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
  btn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
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
