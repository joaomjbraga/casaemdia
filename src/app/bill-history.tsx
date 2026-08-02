import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useBills } from '@/contexts/BillsContext';
import ZappIcon from '@/components/common/ZappIcon';
import BackHeader from '@/components/common/BackHeader';
import { BILL_CATEGORY_LABELS } from '@/types/models';
import { formatCurrency, formatDate } from '@/lib/date-utils';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePressScale } from '@/hooks/usePressAnimation';
import { Animated, Easing } from 'react-native';

type HistoryTab = 'paid' | 'installments' | 'categories';

const TABS: { key: HistoryTab; label: string; icon: string }[] = [
  { key: 'paid', label: 'Pagas', icon: 'check-circle' },
  { key: 'installments', label: 'Parcelamentos', icon: 'layers-outline' },
  { key: 'categories', label: 'Categorias', icon: 'tag-outline' },
];

function HistoryBillRow({
  bill,
  index,
}: {
  bill: any;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-4)).current;
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.99 });

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 25,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 25,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  const categoryLabel = BILL_CATEGORY_LABELS[bill.category as keyof typeof BILL_CATEGORY_LABELS] || 'Outro';
  const isInstallment = bill.totalInstallments > 1;

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/bill-detail?billId=${bill.id}&familyId=${bill.familyId ?? ''}`)}
        style={styles.historyRow}
      >
        <View style={styles.historyRowLeft}>
          <View style={[styles.historyAvatar, { backgroundColor: `${Colors.light.success}14` }]}>
            <ZappIcon name="check-circle" size={20} color={Colors.light.success} />
          </View>
          <View style={styles.historyRowText}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {bill.title}
            </Text>
            <Text style={styles.historyCategory}>{categoryLabel}</Text>
          </View>
        </View>
        <View style={styles.historyRowRight}>
          <Text style={styles.historyAmount}>{formatCurrency(Number(bill.amount))}</Text>
          {isInstallment && (
            <Text style={styles.historyInstallments}>
              {bill.paidInstallments}/{bill.totalInstallments}
            </Text>
          )}
          <Text style={styles.historyDate}>{formatDate(new Date(bill.updatedAt || bill.dueDate))}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CategoryRow({
  category,
  data,
  index,
}: {
  category: string;
  data: { total: number; paid: number; pending: number };
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-4)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 25,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 25,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  const label = BILL_CATEGORY_LABELS[category as keyof typeof BILL_CATEGORY_LABELS] || 'Outro';
  const progress = data.total > 0 ? Math.min(1, data.paid / data.total) : 0;

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View style={styles.categoryRow}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{label}</Text>
          <Text style={styles.categoryAmount}>{formatCurrency(data.total)}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.categoryMeta}>
          <Text style={styles.categoryPaid}>Pago: {formatCurrency(data.paid)}</Text>
          <Text style={styles.categoryPending}>Pendente: {formatCurrency(data.pending)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function BillHistoryScreen() {
  const { bills, monthSummary, refreshBills } = useBills();
  const [activeTab, setActiveTab] = useState<HistoryTab>('paid');
  const [refreshing, setRefreshing] = useState(false);

  const paidBills = bills.filter((b) => b.isPaid);
  const finishedInstallments = paidBills.filter((b) => b.totalInstallments > 1);
  const categories = monthSummary?.byCategory ? Object.entries(monthSummary.byCategory) : [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBills();
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmpty = (message: string) => (
    <View style={styles.emptyContainer}>
      <ZappIcon name="history" size={48} color={Colors.light.tabIconDefault} />
      <Text style={styles.emptyTitle}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <BackHeader title="Histórico" />

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <ZappIcon name={tab.icon} size={16} color={isActive ? Colors.light.textWhite : Colors.light.mutedText} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
        {activeTab === 'paid' &&
          (paidBills.length === 0 ? renderEmpty('Nenhuma conta paga ainda') : paidBills.map((bill, index) => <HistoryBillRow key={bill.id} bill={bill} index={index} />))}

        {activeTab === 'installments' &&
          (finishedInstallments.length === 0
            ? renderEmpty('Nenhum parcelamento finalizado')
            : finishedInstallments.map((bill, index) => <HistoryBillRow key={bill.id} bill={bill} index={index} />))}

        {activeTab === 'categories' &&
          (categories.length === 0
            ? renderEmpty('Sem dados de categorias neste mês')
            : categories.map(([category, data], index) => <CategoryRow key={category} category={category} data={data} index={index} />))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  tabTextActive: {
    color: Colors.light.textWhite,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  historyRowText: {
    flex: 1,
    minWidth: 0,
  },
  historyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  historyCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  historyRowRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.success,
  },
  historyInstallments: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 10,
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  categoryRow: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.light.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.light.success,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryPaid: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.success,
  },
  categoryPending: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textAlign: 'center',
  },
});
