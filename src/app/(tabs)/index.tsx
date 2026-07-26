import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import type { ShoppingItem, Task } from '@/types/models';

import EmptyState from '@/components/common/EmptyState';
import IconCircleButton from '@/components/common/IconCircleButton';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ZappIcon from '@/components/common/ZappIcon';
import Header from '@/components/dashboard/Header';

import TaskListPanel from '@/components/dashboard/TaskCard';
import { useInvitations } from '@/contexts/InvitationContext';
import { fetchDashboardTasks } from '@/services/tasks';
import { fetchDashboardShopping } from '@/services/shopping';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { familyId, members, fetchMembers, loading: membersLoading } = useFamily();
  const { pendingInvitations, acceptInvitation, declineInvitation } = useInvitations();
  const { showAlert } = useAlertDialog();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [shoppingLoading, setShoppingLoading] = useState(true);

  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  const fetchTasks = useCallback(async () => {
    if (!familyId) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);

    try {
      const data = await fetchDashboardTasks(familyId);
      setTasks(data);
    } catch (error) {
      showAlert({
        title: 'Erro',
        message: 'Não foi possível carregar as tarefas.',
        type: 'error',
      });
    } finally {
      setTasksLoading(false);
    }
  }, [familyId, showAlert]);

  const fetchShopping = useCallback(async () => {
    if (!familyId) {
      setShoppingItems([]);
      setShoppingLoading(false);
      return;
    }

    setShoppingLoading(true);

    try {
      const data = await fetchDashboardShopping(familyId);
      setShoppingItems(data);
    } catch {
      showAlert({
        title: 'Erro',
        message: 'Não foi possível carregar a lista de compras.',
        type: 'error',
      });
    } finally {
      setShoppingLoading(false);
    }
  }, [familyId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        fetchTasks();
        fetchShopping();
        fetchMembers();
      }
    }, [familyId, fetchTasks, fetchShopping, fetchMembers]),
  );

  const handleTaskPress = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

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
    },
    [tasks],
  );

  const handleShoppingPress = useCallback(
    (item: ShoppingItem) => {
      router.push({
        pathname: '/shopping-detail',
        params: {
          itemId: item.id,
          name: item.name,
          done: String(item.done),
          quantity: item.quantity ?? '',
          assignee: item.assignee ?? '',
          assigneeId: item.assigneeId ?? '',
        },
      });
    },
    [],
  );

  const isLoading =
    authLoading ||
    (!familyId && membersLoading) ||
    (familyId && tasksLoading && tasks.length === 0 && members.length === 0 && shoppingLoading && shoppingItems.length === 0);

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  const hasShopping = shoppingItems.length > 0;
  const pendingShopping = shoppingItems.filter((i) => !i.done);
  const completedShopping = shoppingItems.filter((i) => i.done);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {pendingInvitations.map((inv) => (
          <View key={inv.id} style={styles.inviteBanner}>
            <View style={styles.inviteIcon}>
              <ZappIcon name="account-plus" size={20} color={Colors.light.primary} />
            </View>
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteTitle}>Convite de Família</Text>
              <Text style={styles.inviteHint}>
                {inv.fromUserName} convidou você para "{inv.familyName}"
              </Text>
            </View>
            <View style={styles.inviteActions}>
              <IconCircleButton
                iconName="check"
                onPress={() => acceptInvitation(inv.id)}
                size={36}
                backgroundColor="rgba(52, 199, 89, 0.15)"
                borderColor="rgba(52, 199, 89, 0.3)"
                iconColor={Colors.light.success}
              />
              <IconCircleButton
                iconName="close"
                onPress={() => declineInvitation(inv.id)}
                size={36}
                backgroundColor="rgba(255, 59, 48, 0.15)"
                borderColor="rgba(255, 59, 48, 0.3)"
                iconColor={Colors.light.danger}
              />
            </View>
          </View>
        ))}

        {tasks.length === 0 && !hasShopping ? (
          <EmptyState
            iconName="checkbox-marked-outline"
            title="Nenhuma tarefa"
            subtitle="As tarefas da família aparecerão aqui"
          />
        ) : (
          <View>
            {tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tarefas</Text>
                <TaskListPanel tasks={tasks} onPressTask={handleTaskPress} />
              </View>
            )}
            {hasShopping && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lista de Compras</Text>
                <View style={styles.shoppingPanel}>
                  {pendingShopping.map((item, idx) => (
                    <View key={item.id}>
                      <TouchableOpacity
                        style={[styles.shoppingRow, idx !== pendingShopping.length - 1 && styles.shoppingRowDivider]}
                        onPress={() => handleShoppingPress(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.shoppingContent}>
                          <Text style={styles.shoppingName} numberOfLines={1}>{item.name}</Text>
                          <View style={styles.shoppingMeta}>
                            {!!item.quantity && (
                              <Text style={styles.shoppingQty}>{item.quantity}</Text>
                            )}
                            {!!item.assignee && (
                              <View style={styles.assigneeBadge}>
                                <ZappIcon name="account-outline" size={12} color={Colors.light.mutedText} />
                                <Text style={styles.assigneeText}>{item.assignee}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={[styles.statusTag, item.done && styles.statusTagDone]}>
                          <Text style={[styles.statusTagText, item.done && styles.statusTagTextDone]}>
                            {item.done ? 'Comprado' : 'Pendente'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {completedShopping.length > 0 && (
                    <View style={styles.completedSection}>
                      <Text style={styles.completedTitle}>Comprados</Text>
                      {completedShopping.map((item, idx) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.shoppingRow, idx !== completedShopping.length - 1 && styles.shoppingRowDivider]}
                          onPress={() => handleShoppingPress(item)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.shoppingContent}>
                            <Text style={[styles.shoppingName, styles.shoppingNameDone]} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.shoppingMeta}>
                              {!!item.assignee && (
                                <View style={styles.assigneeBadge}>
                                  <ZappIcon name="account-outline" size={12} color={Colors.light.mutedText} />
                                  <Text style={styles.assigneeText}>{item.assignee}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={[styles.statusTag, styles.statusTagDone]}>
                            <Text style={[styles.statusTagText, styles.statusTagTextDone]}>Comprado</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: DOCK_CLEARANCE,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.primary}08`,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}15`,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    gap: 12,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.light.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteInfo: {
    flex: 1,
    minWidth: 0,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  inviteHint: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  shoppingPanel: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  shoppingRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  shoppingContent: {
    flex: 1,
  },
  shoppingName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  shoppingNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  shoppingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  shoppingQty: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  assigneeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.mutedText,
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
  completedSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    paddingTop: 8,
  },
  completedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
});
