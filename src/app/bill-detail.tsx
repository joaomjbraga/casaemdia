import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useBills } from '@/contexts/BillsContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import ZappIcon from '@/components/common/ZappIcon';
import BackHeader from '@/components/common/BackHeader';
import PrimaryActionButton from '@/components/common/PrimaryActionButton';
import PaymentModal from '@/components/bills/PaymentModal';
import ImageViewer from '@/components/chat/ImageViewer';
import { BILL_CATEGORY_LABELS, BillInstallment, BillCategory } from '@/types/models';
import { formatCurrency, formatDate, getDaysUntil, toCalendarDate } from '@/lib/date-utils';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePressScale } from '@/hooks/usePressAnimation';
import { Animated, Easing } from 'react-native';
import { cancelBillNotifications } from '@/lib/notifications';

interface InstallmentItem {
  id: string;
  billId: string;
  amount: number;
  paidAmount: number | null;
  dueDate: Date | string;
  paid: boolean;
  paidAt: Date | string | null;
  receiptUrl: string | null;
  installmentNumber: number;
}

export default function BillDetailScreen() {
  const params = useLocalSearchParams<{ billId: string; familyId: string }>();
  const { billId, familyId } = params;
  const { payInstallment, payBill, getBillDetail, deleteBill } = useBills();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const { familyName } = useFamily();

  const [bill, setBill] = useState<any>(null);
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<InstallmentItem | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [receiptViewUri, setReceiptViewUri] = useState<string | null>(null);

  const loadBill = useCallback(async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const result = await getBillDetail(billId);
      if (!result) {
        showAlert({ title: 'Erro', message: 'Conta não encontrada.', type: 'error' });
        router.back();
        return;
      }
      setBill(result.bill);
      setInstallments(result.installments || []);
    } catch {
      showAlert({ title: 'Erro', message: 'Não foi possível carregar a conta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [billId, getBillDetail, showAlert]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBill();
    setRefreshing(false);
  };

  const handlePayInstallment = (installment: InstallmentItem) => {
    setPaymentTarget(installment);
  };

  const handlePaymentConfirm = async (payment: {
    amount?: number;
    receiptUrl?: string;
    receiptPublicId?: string;
  }) => {
    if (!billId || !paymentTarget) return;
    setSubmittingPayment(true);
    try {
      await payInstallment(billId, paymentTarget.id, payment);
      setPaymentTarget(null);
      await loadBill();
    } catch {
      showAlert({ title: 'Erro', message: 'Não foi possível registrar o pagamento.', type: 'error' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePayAll = async () => {
    if (!billId || bill.isPaid) return;
    showDialog({
      title: 'Pagar conta',
      message: `Marcar "${bill.title}" como paga?`,
      type: 'success',
      confirmText: 'Pagar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await payBill(billId);
          await loadBill();
        } catch {
          showAlert({ title: 'Erro', message: 'Não foi possível pagar a conta.', type: 'error' });
        }
      },
    });
  };

  const handleDelete = () => {
    if (!billId) return;
    showDialog({
      title: 'Excluir conta',
      message: `Remover "${bill.title}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteBill(billId);
          router.back();
        } catch {
          showAlert({ title: 'Erro', message: 'Não foi possível excluir.', type: 'error' });
        }
      },
    });
  };

  if (!billId || !familyId) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <BackHeader title="Conta" />
        <View style={styles.loading}>
          <Text style={{ color: Colors.light.mutedText }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <BackHeader title="Conta" />
        <View style={styles.loading}>
          <Text style={{ color: Colors.light.mutedText }}>Conta não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInstallment = bill.totalInstallments > 1;
  const pendingInstallments = installments.filter((i) => !i.paid);
  const completedInstallments = installments.filter((i) => i.paid);
  const totalAmount = installments.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidAmount = installments.filter((i) => i.paid).reduce((sum, i) => sum + Number(i.paidAmount ?? i.amount), 0);
  const remainingAmount = totalAmount - paidAmount;
  const nextInstallment = pendingInstallments[0];

  const categoryLabel = BILL_CATEGORY_LABELS[bill.category as BillCategory] || 'Outro';
  const typeLabel = bill.type === 'recurring' ? 'Recorrente' : 'Única';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BackHeader
        title={bill.title}
        rightContent={
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              router.push({ pathname: '/bill-form', params: { billId, familyId } })
            }
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ZappIcon name="pencil-outline" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: DOCK_CLEARANCE }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoria</Text>
            <Text style={styles.infoValue}>{categoryLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>{typeLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vencimento</Text>
            <Text style={styles.infoValue}>{formatDate(toCalendarDate(bill.dueDate))}</Text>
          </View>
          {bill.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Descrição</Text>
              <Text style={styles.infoValue}>{bill.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progresso de Pagamento</Text>
            <Text style={styles.progressAmount}>
              {formatCurrency(paidAmount)} / {formatCurrency(totalAmount)}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0}%`,
                  backgroundColor: bill.isPaid ? Colors.light.success : Colors.light.primary,
                },
              ]}
            />
          </View>

          <View style={styles.progressMeta}>
            <Text style={styles.progressMetaText}>
              {bill.paidInstallments}/{bill.totalInstallments} parcelas pagas
            </Text>
            {!bill.isPaid && remainingAmount > 0 && (
              <Text style={styles.progressRemaining}>
                Restante: {formatCurrency(remainingAmount)}
              </Text>
            )}
          </View>
        </View>

        {!bill.isPaid && nextInstallment && (
          <View style={styles.nextDueCard}>
            <ZappIcon name="clock-outline" size={18} color={Colors.light.warning} />
            <Text style={styles.nextDueText}>
              Próxima Parcela: {formatDate(toCalendarDate(nextInstallment.dueDate))} ({formatCurrency(Number(nextInstallment.amount))})
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcelas</Text>
          {installments.length === 0 ? (
            <View style={styles.emptyInstallments}>
              <Text style={styles.emptyInstallmentsText}>Nenhuma parcela registrada</Text>
            </View>
          ) : (
            <View style={styles.installmentList}>
              {installments.map((inst, index) => (
                <InstallmentRow
                  key={inst.id}
                  installment={inst}
                  index={index}
                  onPress={() => {
                    if (!inst.paid) {
                      handlePayInstallment(inst);
                    } else if (inst.receiptUrl) {
                      setReceiptViewUri(inst.receiptUrl);
                    }
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {!bill.isPaid && (
          <PrimaryActionButton
            title={isInstallment ? 'Pagar todas as parcelas' : 'Marcar como paga'}
            icon="check"
            onPress={handlePayAll}
            color={Colors.light.success}
            style={styles.payAllBtn}
          />
        )}

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <ZappIcon name="trash-can-outline" size={18} color={Colors.light.danger} />
          <Text style={styles.deleteBtnText}>Excluir conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <PaymentModal
        visible={paymentTarget !== null}
        installmentNumber={paymentTarget?.installmentNumber ?? 0}
        installmentAmount={paymentTarget?.amount ?? 0}
        onClose={() => setPaymentTarget(null)}
        onConfirm={handlePaymentConfirm}
        submitting={submittingPayment}
      />

      <ImageViewer
        visible={receiptViewUri !== null}
        uri={receiptViewUri ?? ''}
        onClose={() => setReceiptViewUri(null)}
      />
    </SafeAreaView>
  );
}

function InstallmentRow({
  installment,
  index,
  onPress,
}: {
  installment: InstallmentItem;
  index: number;
  onPress: () => void;
}) {
  const daysLeft = getDaysUntil(installment.dueDate);
  const isOverdue = !installment.paid && daysLeft < 0;
  const isDueToday = !installment.paid && daysLeft === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={installment.paid && !installment.receiptUrl}
    >
      <View
        style={[
          styles.installmentRow,
          !installment.paid && index === 0 && {},
          installment.paid && styles.installmentRowPaid,
        ]}
      >
        <View style={styles.installmentLeft}>
          <View style={[styles.installmentNumber, installment.paid && styles.installmentNumberPaid]}>
            <Text style={[styles.installmentNumberText, installment.paid && styles.installmentNumberTextPaid]}>
              {installment.installmentNumber}
            </Text>
          </View>
          <View>
            <Text style={[styles.installmentAmount, installment.paid && styles.installmentAmountPaid]}>
              {formatCurrency(Number(installment.amount))}
              {installment.paid && installment.paidAmount != null && Number(installment.paidAmount) !== Number(installment.amount)
                ? ` · ${formatCurrency(Number(installment.paidAmount))}`
                : ''}
            </Text>
            <Text style={styles.installmentDate}>
              {installment.paid
                ? installment.paidAt
                  ? `Pago em: ${formatDate(new Date(installment.paidAt))}`
                  : 'Pago'
                : `Vence: ${formatDate(toCalendarDate(installment.dueDate))}`}
            </Text>
          </View>
        </View>

        {installment.paid ? (
          <View style={styles.paidRight}>
            {installment.receiptUrl && (
              <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Image
                  source={{ uri: installment.receiptUrl }}
                  style={styles.receiptThumb}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}
            <View style={styles.paidBadge}>
              <ZappIcon name="check-circle" size={16} color={Colors.light.success} />
              <Text style={styles.paidBadgeText}>Pago</Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.pendingBadge,
              isOverdue && { backgroundColor: `${Colors.light.danger}10` },
            ]}
          >
            <Text
              style={[
                styles.pendingBadgeText,
                isOverdue && { color: Colors.light.danger },
                !isOverdue && !isDueToday && { color: Colors.light.mutedText },
              ]}
            >
              {isOverdue
                ? `Venceu há ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) > 1 ? 's' : ''}`
                : isDueToday
                  ? 'Vence hoje'
                  : `Vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  editBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  infoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'right',
  },
  progressCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.info,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: Colors.light.progressBackground,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 12,
    color: Colors.light.mutedText,
  },
  progressRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  nextDueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.light.warning}10`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.light.warning}30`,
  },
  nextDueText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyInstallments: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyInstallmentsText: {
    fontSize: 13,
    color: Colors.light.mutedText,
  },
  installmentList: {
    gap: 8,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  installmentRowPaid: {
    opacity: 0.6,
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  installmentNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  installmentNumberPaid: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  installmentNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  installmentNumberTextPaid: {
    color: Colors.light.textWhite,
  },
  installmentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  installmentAmountPaid: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
  },
  installmentDate: {
    fontSize: 11,
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.light.success}10`,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  paidRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.success,
  },
  pendingBadge: {
    backgroundColor: Colors.light.cardDark,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  payAllBtn: {
    marginBottom: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.light.danger}30`,
    backgroundColor: `${Colors.light.danger}10`,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.danger,
  },
});
