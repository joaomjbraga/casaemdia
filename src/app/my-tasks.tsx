import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { fetchDashboardTasks } from '@/services/tasks';
import { subscribeToShoppingItems } from '@/services/shopping';
import BackHeader from '@/components/common/BackHeader';
import Card from '@/components/common/Card';
import XPBadge from '@/components/common/XPBadge';
import Badge from '@/components/common/Badge';
import StatRow from '@/components/common/StatRow';
import FilterToggleGroup from '@/components/common/FilterToggleGroup';
import SectionHeader from '@/components/common/SectionHeader';
import CheckableListItem from '@/components/common/CheckableListItem';
import ZappIcon from '@/components/common/ZappIcon';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Task, ShoppingItem } from '@/types/models';

export default function MyTasksScreen() {
  const { user } = useAuth();
  const { familyId } = useFamily();
  const params = useLocalSearchParams<{ filter: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFilter = (params.filter as 'pending' | 'done') || 'pending';

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

  const pendingPoints = myPendingTasks.reduce((sum, t) => sum + t.points, 0);
  const donePoints = myDoneTasks.reduce((sum, t) => sum + t.points, 0);

  const displayedTasks = activeFilter === 'pending' ? myPendingTasks : myDoneTasks;

  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/task-detail',
      params: {
        taskId: task.id,
        title: task.title,
        assignee: task.assignee,
        assigneeId: task.assigneeId || '',
        points: String(task.points),
        done: String(task.done),
      },
    });
  };

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
        <Card variant="outlined" padding={16} style={styles.statsCard}>
          <StatRow
            stats={[
              {
                icon: 'clock-outline',
                iconColor: Colors.light.warning,
                value: myPendingTasks.length,
                label: 'Pendentes',
              },
              {
                icon: 'check-circle-outline',
                iconColor: Colors.light.success,
                value: myDoneTasks.length,
                label: 'Concluídas',
              },
              {
                icon: 'star',
                iconColor: Colors.light.primary,
                value: activeFilter === 'pending' ? pendingPoints : donePoints,
                label: 'XP',
                valueColor: Colors.light.primary,
              },
            ]}
          />
        </Card>

        <FilterToggleGroup
          options={[
            { key: 'pending', label: 'Pendentes' },
            { key: 'done', label: 'Concluídas' },
          ]}
          activeKey={activeFilter}
          onChange={(key) => router.setParams({ filter: key })}
          style={styles.filterRow}
        />

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
          displayedTasks.map((task) => (
            <CheckableListItem
              key={task.id}
              done={activeFilter === 'done'}
              onToggle={() => handleTaskPress(task)}
              title={task.title}
              subtitle={task.assignee}
              rightContent={<XPBadge points={task.points} size="sm" />}
            />
          ))
        )}

        {myDoneShopping.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon="cart-check"
              iconColor={Colors.light.success}
              title="Compras realizadas"
              badge={myDoneShopping.length}
              badgeColor="success"
              style={styles.sectionHeader}
            />
            {myDoneShopping.map((item) => (
              <View key={item.id} style={styles.shoppingCard}>
                <View style={styles.shoppingCheck}>
                  <ZappIcon name="check" size={14} color="#fff" />
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
        )}
      </ScrollView>
    </View>
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
  statsCard: {
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  shoppingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(88, 204, 2, 0.2)',
  },
  shoppingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shoppingContent: {
    flex: 1,
  },
  shoppingName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.light.mutedText,
  },
  shoppingQty: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
});
