import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import TaskListPanel from '@/components/dashboard/TaskCard';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';

import TasksScreenHeader from '@/components/tasks/TasksScreenHeader';
import Colors from '@/constants/Colors';
import { DOCK_CLEARANCE } from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import {
  deleteAllTasks,
  deleteTask,
  fetchDashboardTasks,
  subscribeToTasks,
  toggleTaskCompletion,
} from '@/services/tasks';
import type { Task } from '@/types/models';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { user, backendUserId } = useAuth();
  const { familyId } = useFamily();
  const { showAlert } = useAlertDialog();
  const { showDialog } = useConfirmDialog();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  useEffect(() => {
    if (!familyId) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    let cleanup: (() => void) | undefined;

    subscribeToTasks(familyId, (data) => {
      setTasks(data as Task[]);
      setTasksLoading(false);
      setRefreshing(false);
    }).then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      cleanup?.();
    };
  }, [familyId]);

  const toggleTask = async (id: string) => {
    if (!familyId || !user) return;
    const task = tasksRef.current.find((t) => t.id === id);
    if (!task) return;

    const newDone = !task.done;
    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.map((t) => (t.id === id ? { ...t, done: newDone } : t));
    });

    try {
      await toggleTaskCompletion({
        familyId,
        taskId: id,
        task,
        newDone,
        options: {
          userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
          userId: backendUserId ?? undefined,
        },
      });
    } catch {
      setTasks(() => snapshot);
      showAlert({
        title: 'Erro',
        message: 'Nao foi possivel atualizar a tarefa.',
        type: 'error',
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!familyId || !user) return;

    const deletedTask = tasks.find((t) => t.id === id);
    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.filter((t) => t.id !== id);
    });

    try {
      await deleteTask({
        familyId,
        taskId: id,
        title: deletedTask?.title,
        options: {
          userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
          userId: backendUserId ?? undefined,
        },
      });
    } catch {
      setTasks(() => snapshot);
      showAlert({
        title: 'Erro',
        message: 'Não foi possível excluir a tarefa.',
        type: 'error',
      });
    }
  };

  const handleDeletePress = (id: string) => {
    const task = tasks.find((t) => t.id === id);

    showDialog({
      title: 'Excluir tarefa',
      message: task ? `Remover "${task.title}"?` : 'Remover esta tarefa?',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: () => handleDeleteTask(id),
    });
  };

  const onRefresh = async () => {
    if (!familyId) return;
    setRefreshing(true);
    try {
      const data = await fetchDashboardTasks(familyId);
      setTasks(data);
    } finally {
      setRefreshing(false);
    }
  };

  const openAdd = () => router.push('/AddTaskScreen');

  const handleTaskPress = (taskId: string) => {
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
  };

  const handleDeleteAll = async () => {
    if (!familyId || tasks.length === 0) return;

    showDialog({
      title: 'Excluir todas as tarefas',
      message: `Remover todas as ${tasks.length} tarefa(s)?`,
      type: 'danger',
      confirmText: 'Excluir todas',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const previousTasks = tasksRef.current;
        setTasks([]);

        try {
          await deleteAllTasks({
            familyId: familyId!,
            tasks: previousTasks,
            options: user
              ? {
                  userName: user.displayName || user.email?.split('@')[0] || 'Alguém',
                  userId: backendUserId ?? undefined,
                }
              : undefined,
          });
        } catch {
          setTasks(() => previousTasks);
          showAlert({
            title: 'Erro',
            message: 'Não foi possível excluir as tarefas.',
            type: 'error',
          });
        }
      },
    });
  };

  if (tasksLoading && tasks.length === 0) {
    return <LoadingSkeleton variant="tasks" />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerSpacer} />

      <TasksScreenHeader
        hasTasks={tasks.length > 0}
        onDeleteAll={handleDeleteAll}
        onAdd={openAdd}
      />

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
        {tasks.length === 0 ? (
          <EmptyState
            iconName="checkbox-marked-outline"
            title="Nenhuma tarefa"
            subtitle="Toque em adicionar para criar a primeira tarefa"
          />
        ) : (
          <TaskListPanel tasks={tasks} onPressTask={handleTaskPress} />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: DOCK_CLEARANCE,
  },
});
