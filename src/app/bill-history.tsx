import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useBills } from '@/contexts/BillsContext';
import ZappIcon from '@/components/common/ZappIcon';
import BackHeader from '@/components/common/BackHeader';
import { BILL_CATEGORY_LABELS } from '@/types/models';
import { formatCurrency, formatDate } from '@/lib/date-utils';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePressScale } from '@/hooks/usePressAnimation';
import { Animated, Easing } from 'react-native';

type HistoryTab = 'paid' | 'installments' | 'categories';

function HistoryBillRow = ({
  bill,
  index,
}: {
  bill: any;
  index: number;
}) => {
  const opacity = useState(new Animated.Value(0))[0];
  const translateX = useState(new Animated.Value(-4))[0];

  useState(() => {
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
  });

  const categoryLabel = BILL_CATEGORY_LABELS[bill.category] || 'Outro';

  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.99 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/bill-detail?billId=${bill.id}`)}
        style={[styles.historyRow, { opacity: bill.isPaid ? 0.7 : 1 }]}
      >
        <View style={styles.historyRowLeft}>
          <View style={[styles.historyAvatar, { backgroundColor: `${Colors.light.success}14` }]}>
            <ZappIcon name="check-circle" size={20} color={Colors.light.success} />
          </View>
          <View>
            <Text style={[styles.historyTitle, bill.isPaid && styles.historyTitlePaid]} numberOfLines={1}>
              {bill.title}
            </Text>
            <Text style={styles.historyCategory}>{categoryLabel}</Text>
          </View>
        </View>
        <View style={styles.historyRowRight}>
          <Text style={[styles.historyAmount, bill.isPaid && styles.historyAmountPaid]}>
            {formatCurrency(bill.amount)}
          </Text>
          <Text style={styles.historyDate}>
            {formatDate(new Date(bill.updatedAt || bill.dueDate))}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
