import Colors from '@/constants/Colors';
import StyledInput from '@/components/common/StyledInput';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { formatCurrency } from '@/lib/date-utils';
import logger from '@/lib/logger';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Receipt {
  url: string;
  publicId: string;
}

interface PaymentModalProps {
  visible: boolean;
  installmentNumber: number;
  installmentAmount: number;
  onClose: () => void;
  onConfirm: (payment: { amount?: number; receiptUrl?: string; receiptPublicId?: string }) => void;
  submitting: boolean;
}

export default function PaymentModal({
  visible,
  installmentNumber,
  installmentAmount,
  onClose,
  onConfirm,
  submitting,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount(String(installmentAmount));
      setReceipt(null);
      setUploading(false);
      setError(null);
    }
  }, [visible, installmentAmount]);

  const handlePickReceipt = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permissão de galeria negada. Habilite nas configurações do app.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      setUploading(true);
      setError(null);

      try {
        const uploaded = await uploadToCloudinary(
          asset.uri,
          asset.fileName || `comprovante-${Date.now()}.jpg`,
          asset.mimeType,
        );
        setReceipt({ url: uploaded.url, publicId: uploaded.publicId });
      } catch (uploadError) {
        logger.error('[PaymentModal] upload error', uploadError);
        setError('Não foi possível enviar o comprovante. Tente novamente.');
      } finally {
        setUploading(false);
      }
    } catch (pickerError) {
      logger.error('[PaymentModal] picker error', pickerError);
      setError('Não foi possível abrir a galeria.');
    }
  };

  const handleConfirm = () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Informe um valor válido.');
      return;
    }
    if (parsed < installmentAmount) {
      setError('O valor pago não pode ser menor que o valor da parcela.');
      return;
    }

    onConfirm({
      amount: parsed,
      receiptUrl: receipt?.url,
      receiptPublicId: receipt?.publicId,
    });
  };

  const canConfirm = !submitting && !uploading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>Registrar pagamento</Text>
          <Text style={styles.subtitle}>
            Parcela {installmentNumber} · Valor: {formatCurrency(installmentAmount)}
          </Text>

          <Text style={styles.label}>Valor pago</Text>
          <StyledInput
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setError(null);
            }}
            placeholder="0,00"
            keyboardType="decimal-pad"
            style={styles.input}
            editable={!submitting}
          />
          <Text style={styles.hint}>
            Pode ser maior que o valor da parcela, se pagou um valor adicional.
          </Text>

          <Text style={styles.label}>Comprovante (opcional)</Text>
          {receipt ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receipt.url }} style={styles.receiptImage} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeReceipt}
                onPress={() => setReceipt(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.removeReceiptText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.receiptButton}
              onPress={handlePickReceipt}
              activeOpacity={0.7}
              disabled={uploading || submitting}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Text style={styles.receiptButtonText}>Adicionar foto do comprovante</Text>
              )}
            </TouchableOpacity>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!canConfirm}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Confirmar pagamento</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  card: {
    backgroundColor: Colors.light.dialogBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.mutedText,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: Colors.light.mutedText,
    marginTop: 6,
  },
  receiptButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.light.cardDark,
  },
  removeReceipt: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: `${Colors.light.danger}10`,
  },
  removeReceiptText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.danger,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.light.cardDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textWhite,
  },
});
