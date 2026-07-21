import Colors from '@/constants/Colors';
import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
import { Text, Pressable, StyleSheet, Modal } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import { dialogStyles } from './dialogStyles';

type AlertDialogType = 'success' | 'error' | 'info';

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

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within AlertDialogProvider');
  }
  return context;
};

export const AlertDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertDialogConfig>({ title: '' });

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

  const typeConfig = useMemo(
    () => ({
      success: {
        icon: 'check-circle-outline' as const,
        color: Colors.light.success,
        bgColor: 'rgba(52, 199, 89, 0.12)',
      },
      error: {
        icon: 'close-circle-outline' as const,
        color: Colors.light.danger,
        bgColor: 'rgba(255, 59, 48, 0.12)',
      },
      info: {
        icon: 'information-outline' as const,
        color: Colors.light.info,
        bgColor: 'rgba(90, 200, 250, 0.12)',
      },
    }),
    [],
  );

  const current = typeConfig[config.type || 'success'];

  return (
    <AlertDialogContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <Pressable style={dialogStyles.backdrop} onPress={hideAlert}>
          <Pressable style={dialogStyles.dialogContent} onPress={() => {}}>
            <Pressable
              style={[dialogStyles.iconCircle, { backgroundColor: current.bgColor }]}
              onPress={hideAlert}
            >
              <ZappIcon name={current.icon} size={36} color={current.color} />
            </Pressable>

            <Text style={dialogStyles.title}>{config.title}</Text>
            {config.message && <Text style={dialogStyles.message}>{config.message}</Text>}

            <Pressable
              style={({ pressed }) => [
                dialogStyles.btn,
                { backgroundColor: current.color },
                pressed && dialogStyles.btnPressed,
              ]}
              onPress={hideAlert}
            >
              <Text style={dialogStyles.btnText}>{config.buttonText || 'OK'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertDialogContext.Provider>
  );
};
