import ZappIcon from '@/components/common/ZappIcon';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBills } from '@/contexts/BillsContext';
import { useFamily } from '@/contexts/FamilyContext';
import { BILL_CATEGORY_LABELS, BILL_TYPE_LABELS } from '@/types/models';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePressScale } from '@/hooks/usePressAnimation';
import { Animated, Easing } from 'react-native';
import { formatCurrency, getDaysUntil, startOfDay } from '@/lib/date-utils';

type BillStatus = 'pending' | 'overdue' | 'paid';

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function BillRow({
  bill,
  index,
  onPress,
}: {
  bill: any;
  index: number;
  onPress: (bill: any) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-4)).current;
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.99 });

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  const dueDate = new Date(bill.dueDate);
  const now = startOfDay(new Date());
  const daysLeft = Math.ceil((dueDate.setHours(0, 0, 0, 0) - now.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = !bill.isPaid && daysLeft < 0;
  const isDueToday = !bill.isPaid && daysLeft === 0;

  let statusColor = Colors.light.info;
  let statusText = '';

  if (bill.isPaid) {
    statusColor = Colors.light.success;
    statusText = 'Pago';
  } else if (isOverdue) {
    statusColor = Colors.light.danger;
    statusText = `Venceu há ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) > 1 ? 's' : ''}`;
  } else if (isDueToday) {
    statusColor = Colors.light.warning;
    statusText = 'Vence hoje';
  } else {
    statusColor = Colors.light.mutedText;
    statusText = `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`;
  }

  const categoryLabel = BILL_CATEGORY_LABELS[bill.category] || 'Outro';
  const typeLabel = BILL_TYPE_LABELS[bill.type] || 'Única';

  const isInstallment = bill.totalInstallments > 1;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onPress(bill)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.billRow,
          { opacity, transform: [{ translateX }, { scale }] },
          bill.isPaid && styles.billRowPaid,
        ]}
      >
        <View style={[styles.billAvatar, { backgroundColor: `${statusColor}14` }]}>
          <ZappIcon name="receipt-text-outline" size={20} color={statusColor} />
        </View>

        <View style={styles.billContent}>
          <Text style={[styles.billTitle, bill.isPaid && styles.billTitlePaid]} numberOfLines={1}>
            {bill.title}
          </Text>
          <View style={styles.billMeta}>
            <Text style={styles.billCategory}>{categoryLabel}</Text>
            {!!isInstallment && (
              <View style={styles.installmentBadge}>
                <Text style={styles.installmentText}>
                  {bill.paidInstallments}/{bill.totalInstallments} parcelas
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.billAmount}>
          <Text style={[styles.billAmountText, bill.isPaid && styles.billAmountTextPaid]}>
            {formatCurrency(bill.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}10` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BillsScreen() {
  const { user, backendUserId } = useAuth();
  const { familyId, members } = useFamily();
  const { bills, monthSummary, loading, deleteBill, payBill } = useBills();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const [refreshing, setRefreshing] = useState(false);

  const pendingBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);

  const overdueBills = pendingBills.filter((b) => {
    const due = new Date(b.dueDate);
    return due < new Date();
  });

  const upcomingBills = pendingBills
    .filter((b) => {
      const due = new Date(b.dueDate);
      return due >= new Date();
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handlePayBill = async (bill: any) => {
    if (!familyId) return;

    const isInstallmentBill = bill.totalInstallments > 1;
    const action = isInstallmentBill ? 'pagar primeira parcela' : 'marcar como paga';

    showDialog({
      title: `Marcar como paga?`,
      message: `Deseja ${action} "${bill.title}"?`,
      type: 'success',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          if (isInstallmentBill) {
            router.push({
              pathname: '/bill-detail',
              params: { billId: bill.id, familyId },
            });
          } else {
            await payBill(bill.id);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch {
          showAlert({
            title: 'Erro',
            message: 'Não foi possível atualizar a conta.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleDelete = (bill: any) => {
    showDialog({
      title: 'Excluir conta',
      message: `Remover "${bill.title}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteBill(bill.id);
        } catch {
          showAlert({
            title: 'Erro',
            message: 'Não foi possível excluir a conta.',
            type: 'error',
          });
        }
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const { refreshBills } = await import('@/services/bills');
      await refreshBills();
    } catch (error) {
      console.error('refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!familyId) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.headerSpacer} />
        <View style={{ padding: 20 }}>
          <Text style={{ color: Colors.light.mutedText }}>Família não carregada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerSpacer} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/bill-form')}
        >
          <ZappIcon name="plus" size={20} color={Colors.light.textWhite} />
        </TouchableOpacity>
      </View>

      {monthSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(monthSummary.totalPending)}</Text>
              <Text style={styles.summaryLabel}>Pendente</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.light.success }]}>{formatCurrency(monthSummary.totalPaid)}</Text>
              <Text style={styles.summaryLabel}>Pago</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{monthSummary.totalBills}</Text>
              <Text style={styles.summaryLabel}>Contas</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{monthSummary.totalInstallments}</Text>
              <Text style={styles.summaryLabel}>Parcelas</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
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
        {overdueBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ZappIcon name="alert-octagon" size={18} color={Colors.light.danger} />
              <Text style={[styles.sectionTitle, { color: Colors.light.danger }]}>Vencidas</Text>
            </View>
            {overdueBills.map((bill, index) => (
              <BillRow
                key={bill.id}
                bill={bill}
                index={index}
                onPress={(b) => router.push({ pathname: '/bill-detail', params: { billId: b.id, familyId } })}
              />
            ))}
          </View>
        )}

        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximas</Text>
            {upcomingBills.map((bill, index) => (
              <BillRow
                key={bill.id}
                bill={bill}
                index={index}
                onPress={(b) => router.push({ pathname: '/bill-detail', params: { billId: b.id, familyId } })}
              />
            ))}
          </View>
        )}

        {pendingBills.length === 0 && (
          <View style={styles.emptyContainer}>
            <ZappIcon name="receipt-text-check-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>Nenhuma conta pendente</Text>
            <Text style={styles.emptySubtitle}>Toque em + para adicionar uma nova conta</Text>
          </View>
        )}

        {paidBills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagas</Text>
            {paidBills.map((bill, index) => (
              <BillRow
                key={bill.id}
                bill={bill}
                index={index}
                onPress={(b) => router.push({ pathname: '/bill-detail', params: { billId: b.id, familyId } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerSpacer: {
    height: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: DOCK_CLEARANCE,
  },
  summaryCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  billRowPaid: {
    opacity: 0.6,
  },
  billAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  billContent: {
    flex: 1,
    minWidth: 0,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  billTitlePaid: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  billMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  installmentBadge: {
    backgroundColor: Colors.light.cardDark,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  installmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  billAmount: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  billAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  billAmountTextPaid: {
    color: Colors.light.mutedText,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.mutedText,
    textAlign: 'center',
  },
});
