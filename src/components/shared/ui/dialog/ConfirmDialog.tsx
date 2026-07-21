import Colors from '@/constants/Colors';
import React, { useState, useCallback, createContext, useContext } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import ZappIcon from '@/components/common/ZappIcon';
import { dialogStyles } from './dialogStyles';

type DialogType = 'confirm' | 'danger' | 'success' | 'error';

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

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({ title: '' });
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

  const { onConfirm, onCancel } = config;

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      setLoading(true);
      try {
        await onConfirm();
      } catch (e) {
        // error handled by caller
      } finally {
        setLoading(false);
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    setVisible(false);
    setLoading(false);
  }, [onCancel]);

  const typeConfig = {
    confirm: {
      icon: 'help-circle-outline' as const,
      color: Colors.light.accentPurple,
      bgColor: Colors.light.accentPurpleSurface,
    },
    danger: {
      icon: 'alert-circle-outline' as const,
      color: Colors.light.danger,
      bgColor: 'rgba(255, 59, 48, 0.12)',
    },
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
  };

  const current = typeConfig[config.type || 'confirm'];

  return (
    <ConfirmDialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideDialog}>
        <Pressable style={dialogStyles.backdrop} onPress={hideDialog}>
          <Pressable style={dialogStyles.dialogContent} onPress={() => {}}>
            <View style={[dialogStyles.iconCircle, { backgroundColor: current.bgColor }]}>
              <ZappIcon name={current.icon} size={36} color={current.color} />
            </View>

            <Text style={dialogStyles.title}>{config.title}</Text>
            {config.message && <Text style={dialogStyles.message}>{config.message}</Text>}

            <View style={[styles.actions, config.showCancel === false && styles.actionsSingle]}>
              {config.showCancel !== false && (
                <Pressable
                  style={({ pressed }) => [
                    dialogStyles.btn,
                    styles.cancelBtn,
                    pressed && dialogStyles.btnPressed,
                  ]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>{config.cancelText || 'Cancelar'}</Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  dialogStyles.btn,
                  config.showCancel === false && styles.btnSingle,
                  config.type === 'danger' || config.type === 'error'
                    ? styles.dangerBtn
                    : config.type === 'success'
                      ? styles.successBtn
                      : styles.confirmBtn,
                  loading && styles.btnDisabled,
                  pressed && dialogStyles.btnPressed,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.confirmText}>
                  {loading ? 'Aguarde...' : config.confirmText || 'Confirmar'}
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  actionsSingle: {
    justifyContent: 'center',
  },
  btnSingle: {
    width: '100%',
    flex: undefined,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    backgroundColor: Colors.light.cardDark,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  confirmBtn: {
    backgroundColor: Colors.light.accentPurple,
  },
  dangerBtn: {
    backgroundColor: Colors.light.danger,
  },
  successBtn: {
    backgroundColor: Colors.light.success,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
