import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useFamily } from '@/contexts/FamilyContext';
import { useBills } from '@/contexts/BillsContext';
import ZappIcon from '@/components/common/ZappIcon';
import BackHeader from '@/components/common/BackHeader';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePressScale } from '@/hooks/usePressAnimation';
import { Animated, Easing } from 'react-native';
import { toCalendarDate } from '@/lib/date-utils';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasBills: boolean;
  bills: any[];
}

function CalendarDayCell({ day, index, onPress }: {
  day: CalendarDay;
  index: number;
  onPress: (day: CalendarDay) => void;
}) {
  const opacity = useState(new Animated.Value(0))[0];
  const translateX = useState(new Animated.Value(-4))[0];
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.85 });

  useState(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 15,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 15,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  });

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }, { translateX }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(day)}
        disabled={!day.hasBills}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.dayCellOtherMonth,
          day.isToday && styles.dayCellToday,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            !day.isCurrentMonth && styles.dayTextOtherMonth,
            day.isToday && styles.dayTextToday,
          ]}
        >
          {day.date.getDate()}
        </Text>
        {day.hasBills && (
          <View style={styles.billDotContainer}>
            {day.bills.slice(0, 3).map((_, dotIndex) => (
              <View key={dotIndex} style={[styles.billDot, { backgroundColor: Colors.light.danger }]} />
            ))}
            {day.bills.length > 3 && (
              <View style={styles.billDotMore}>
                <Text style={styles.billDotMoreText}>+{day.bills.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BillCalendarScreen() {
  const { familyId } = useFamily();
  const { bills, installments } = useBills();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysFromPrev = firstDayOfMonth;

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysFromPrev; i++) {
      const prevDate = new Date(currentYear, currentMonth - 1, daysInMonth - daysFromPrev + i + 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        hasBills: false,
        bills: [],
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      date.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();

      const dayBills = installments.filter((inst) => {
        const instDate = toCalendarDate(inst.dueDate);
        return instDate.getTime() === date.getTime() && !inst.paid;
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasBills: dayBills.length > 0,
        bills: dayBills,
      });
    }

    const remaining = (7 - (daysFromPrev + daysInMonth) % 7) % 7;
    for (let i = 0; i < remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i + 1);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        hasBills: false,
        bills: [],
      });
    }

    return days;
  }, [currentMonth, currentYear, daysInMonth, daysFromPrev, installments]);

  const pendingCount = installments.filter((i) => !i.paid).length;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (day: CalendarDay) => {
    if (!day.hasBills) return;
    if (day.bills[0]?.billId) {
      router.push({
        pathname: '/bill-detail',
        params: { billId: day.bills[0].billId, familyId: familyId ?? '' },
      });
    }
  };

  const billsDueToday = calendarDays.filter((d) => d.isToday && d.hasBills);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <BackHeader title="Calendário Financeiro" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} hitSlop={12}>
          <ZappIcon name="chevron-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} hitSlop={12}>
          <ZappIcon name="chevron-right" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pendentes</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{billsDueToday.length}</Text>
          <Text style={styles.summaryLabel}>Vencem hoje</Text>
        </View>
        <TouchableOpacity
          style={styles.summaryItem}
          onPress={() => router.push('/bill-history')}
          activeOpacity={0.7}
        >
          <Text style={styles.summaryValue}>{bills.filter((b) => b.isPaid).length}</Text>
          <Text style={styles.summaryLabel}>Pagas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendar}>
        <View style={styles.dayHeader}>
          {DAY_NAMES.map((day, i) => (
            <Text key={i} style={styles.dayHeaderText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => (
            <CalendarDayCell
              key={index}
              day={day}
              index={index}
              onPress={handleDayPress}
            />
          ))}
        </View>
      </View>

      <View style={styles.legendSection}>
        <Text style={styles.legendTitle}>Legenda</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.danger }]} />
            <Text style={styles.legendText}>Vencimento</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.success }]} />
            <Text style={styles.legendText}>Pago</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.warning }]} />
            <Text style={styles.legendText}>Vence hoje</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => router.push('/bill-history')}
        activeOpacity={0.7}
      >
        <ZappIcon name="history" size={18} color={Colors.light.textWhite} />
        <Text style={styles.historyBtnText}>Ver histórico completo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calendar: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: Colors.light.primary,
    borderRadius: 999,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  dayTextOtherMonth: {
    color: Colors.light.mutedText,
  },
  dayTextToday: {
    color: Colors.light.textWhite,
    fontWeight: '700',
  },
  billDotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  billDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  billDotMore: {
    backgroundColor: Colors.light.mutedText,
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  billDotMoreText: {
    fontSize: 8,
    color: Colors.light.textWhite,
  },
  legendSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.mutedText,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: DOCK_CLEARANCE,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  historyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textWhite,
  },
});
