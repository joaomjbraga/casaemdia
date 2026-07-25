import BackHeader from '@/components/common/BackHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { usePressScale } from '@/hooks/usePressAnimation';
import { subscribeToShoppingItems } from '@/services/shopping';
import { fetchDashboardTasks } from '@/services/tasks';
import type { ShoppingItem, Task } from '@/types/models';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterKey = 'pending' | 'done';

export default function MyTasksScreen() {
  const { user } = useAuth();
  const { familyId } = useFamily();
  const params = useLocalSearchParams<{ filter: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFilter = (params.filter as FilterKey) || 'pending';

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadTasks = async () => {
      try {
        const data = await fetchDashboardTasks(familyId);
        if (mounted) setTasks(data);
      } catch {}
    };

    const unsubShopping = subscribeToShoppingItems(familyId, (items) => {
      if (mounted) setShopping(items as ShoppingItem[]);
    });

    loadTasks().then(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsubShopping();
    };
  }, [familyId]);

  const myPendingTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === user?.uid && !t.done),
    [tasks, user?.uid],
  );

  const myDoneTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === user?.uid && t.done),
    [tasks, user?.uid],
  );

  const myDoneShopping = useMemo(() => shopping.filter((s) => s.done), [shopping]);

  const displayedTasks = activeFilter === 'pending' ? myPendingTasks : myDoneTasks;

  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/task-detail',
      params: {
        taskId: task.id,
        title: task.title,
        assignee: task.assignee,
        assigneeId: task.assigneeId || '',
        done: String(task.done),
      },
    });
  };

  const handleFilterChange = useCallback((key: FilterKey) => {
    router.setParams({ filter: key });
  }, []);

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  if (!familyId) {
    return (
      <View style={styles.container}>
        <BackHeader title="Minhas Tarefas" />
        <EmptyState
          iconName="account-question-outline"
          title="Sem família"
          subtitle="Você não pertence a nenhuma família no momento"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Minhas Tarefas" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentedControl}>
          <SegmentButton
            label="Pendentes"
            icon="clock-outline"
            active={activeFilter === 'pending'}
            onPress={() => handleFilterChange('pending')}
          />
          <SegmentButton
            label="Concluídas"
            icon="check-circle-outline"
            active={activeFilter === 'done'}
            onPress={() => handleFilterChange('done')}
          />
        </View>

        {displayedTasks.length === 0 ? (
          <EmptyState
            iconName={activeFilter === 'pending' ? 'checkbox-marked-outline' : 'clock-outline'}
            title={activeFilter === 'pending' ? 'Nenhuma pendente' : 'Nenhuma concluída'}
            subtitle={
              activeFilter === 'pending'
                ? 'Você está em dia com suas tarefas!'
                : 'Complete tarefas para vê-las aqui'
            }
          />
        ) : (
          <View style={styles.panel}>
            {displayedTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                title={task.title}
                assignee={task.assignee}
                done={activeFilter === 'done'}
                index={i}
                isLast={i === displayedTasks.length - 1}
                onPress={() => handleTaskPress(task)}
              />
            ))}
          </View>
        )}

        {myDoneShopping.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Compras realizadas</Text>
            </View>

            <View style={styles.panel}>
              {myDoneShopping.map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.shoppingRow, i !== myDoneShopping.length - 1 && styles.rowDivider]}
                >
                  <View style={styles.shoppingCheck}>
                    <ZappIcon name="check" size={12} color="#fff" />
                  </View>
                  <View style={styles.shoppingContent}>
                    <Text style={styles.shoppingName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.quantity ? <Text style={styles.shoppingQty}>{item.quantity}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SegmentButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.98 });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.segmentTouchable}
    >
      <Animated.View
        style={[
          styles.segmentButton,
          active && styles.segmentButtonActive,
          { transform: [{ scale }] },
        ]}
      >
        <ZappIcon
          name={icon as any}
          size={14}
          color={active ? Colors.light.text : Colors.light.mutedText}
        />
        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TaskRow({
  title,
  assignee,
  done,
  index,
  isLast,
  onPress,
}: {
  title: string;
  assignee: string;
  done: boolean;
  index: number;
  isLast: boolean;
  onPress: () => void;
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
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 35,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.taskRow,
          !isLast && styles.rowDivider,
          { opacity, transform: [{ translateX }, { scale }] },
        ]}
      >
        <View style={[styles.avatar, done && styles.avatarDone]}>
          <Text style={[styles.avatarText, done && styles.avatarTextDone]}>
            {getInitials(assignee)}
          </Text>
        </View>

        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, done && styles.rowTitleDone]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.rowAssignee} numberOfLines={1}>
            {assignee}
          </Text>
        </View>

        <View style={[styles.statusTag, done && styles.statusTagDone]}>
          <Text style={[styles.statusTagText, done && styles.statusTagTextDone]}>
            {done ? 'Concluída' : 'Pendente'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    marginBottom: 16,
    padding: 3,
    gap: 3,
  },
  segmentTouchable: {
    flex: 1,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
    letterSpacing: 0.1,
  },
  segmentLabelActive: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  avatarTextDone: {
    color: '#fff',
  },
  rowContent: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  rowAssignee: {
    fontSize: 11,
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  statusTag: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusTagDone: {
    borderColor: Colors.light.success,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.mutedText,
    letterSpacing: 0.2,
  },
  statusTagTextDone: {
    color: Colors.light.success,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  shoppingCheck: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shoppingContent: {
    flex: 1,
  },
  shoppingName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.light.mutedText,
  },
  shoppingQty: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
});
