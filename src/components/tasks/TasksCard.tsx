import type { Task } from '@/types/models';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import { useCelebration } from '@/hooks/useCelebration';
import { useLevelUp } from '@/hooks/useLevelUp';
import { toast } from '@/lib/toast';
import ZappIcon from '@/components/common/ZappIcon';
import XPBadge from '@/components/common/XPBadge';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import EmptyState from '@/components/common/EmptyState';
import SectionTitle from '@/components/common/SectionTitle';
import TaskCard from '@/components/tasks/TaskCard';
import DashboardTaskCard from '@/components/dashboard/TaskCard';

interface TasksListProps {
  tasks: Task[];
  toggleTask?: (id: string) => Promise<void>;
  deleteTask?: (id: string) => Promise<void>;
  maxHeight?: number;
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
  readOnly?: boolean;
  onEmptyAction?: () => void;
  onTaskPress?: (taskId: string) => void;
}

export default function TasksList({
  tasks,
  toggleTask,
  deleteTask,
  maxHeight = 400,
  progressPercentage: propProgress,
  completedTasks: propCompleted,
  totalTasks: propTotal,
  readOnly = false,
  onEmptyAction,
  onTaskPress,
}: TasksListProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [errorTaskId, setErrorTaskId] = useState<string | null>(null);
  const { showDialog } = useConfirmDialog();
  const { celebrate, CelebrationOverlay } = useCelebration();
  const { showLevelUp, LevelUpOverlay } = useLevelUp();
  const previousTotalPoints = useRef(0);

  const completedCount = propCompleted ?? tasks.filter((t) => t.done).length;
  const totalCount = propTotal ?? tasks.length;
  const progressPercentage =
    propProgress ?? (totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
  const isComplete = totalCount > 0 && completedCount === totalCount;

  const totalPoints = useMemo(() => tasks.reduce((sum, t) => sum + t.points, 0), [tasks]);

  const getLevel = useCallback((points: number) => {
    if (points >= 1000) return 5;
    if (points >= 600) return 4;
    if (points >= 300) return 3;
    if (points >= 100) return 2;
    return 1;
  }, []);

  useEffect(() => {
    const currentLevel = getLevel(totalPoints);
    const prevLevel = getLevel(previousTotalPoints.current);
    if (currentLevel > prevLevel) {
      showLevelUp(currentLevel);
    }
    previousTotalPoints.current = totalPoints;
  }, [totalPoints, getLevel, showLevelUp]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.done), [tasks]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(isComplete ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPercentage, progressAnim]);

  useEffect(() => {
    Animated.timing(checkOpacity, {
      toValue: isComplete ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isComplete, checkOpacity]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const handleToggle = async (taskId: string) => {
    if (loadingTaskId === taskId || !toggleTask) return;
    const task = tasks.find((t) => t.id === taskId);
    const willCompleteAll =
      !!task && !task.done && totalCount >= 1 && completedCount === totalCount - 1;
    setLoadingTaskId(taskId);
    setErrorTaskId(null);
    try {
      await toggleTask(taskId);
      if (!task?.done) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (willCompleteAll) celebrate();
    } catch {
      setErrorTaskId(taskId);
      toast.error('Não foi possível alterar a tarefa.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const isTaskLoading = (taskId: string) => loadingTaskId === taskId;

  const handleDelete = (taskId: string) => {
    if (!deleteTask) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    showDialog({
      title: 'Excluir Tarefa',
      message: `Remover "${task.title}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteTask(taskId);
        } catch {
          toast.error('Não foi possível excluir.');
        }
      },
    });
  };

  const renderTaskGroup = (groupTasks: Task[]) =>
    groupTasks.map((task, index) => (
      <View key={task.id}>
        {readOnly ? (
          <DashboardTaskCard
            title={task.title}
            done={task.done}
            assignee={task.assignee}
            points={task.points}
            index={index}
            taskId={task.id}
            onPress={onTaskPress}
          />
        ) : (
          <TaskCard
            title={task.title}
            done={task.done}
            assignee={task.assignee}
            points={task.points}
            onToggle={() => handleToggle(task.id)}
            onDelete={() => handleDelete(task.id)}
            isLoading={isTaskLoading(task.id)}
            index={index}
            error={errorTaskId === task.id}
          />
        )}
        {index < groupTasks.length - 1 && <View style={styles.separator} />}
      </View>
    ));

  if (tasks.length === 0) {
    return (
      <View style={styles.card}>
        <EmptyState
          iconName="checkbox-marked-outline"
          title="Nenhuma tarefa"
          subtitle="Crie tarefas para começar a organizar"
          actionLabel={readOnly ? undefined : 'Nova tarefa'}
          onAction={onEmptyAction}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Tarefas</Text>
            <Text style={styles.subtitle}>
              {completedCount}/{totalCount}
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: animatedWidth }]} />
            </View>
            <Animated.View style={[styles.progressCheck, { opacity: checkOpacity }]}>
              <ZappIcon name="check" size={12} color={Colors.light.success} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.list}>
          {!readOnly && pendingTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <SectionTitle
                  label="Pendentes"
                  color={Colors.light.text}
                  fontSize={14}
                  fontWeight="700"
                  letterSpacing={-0.2}
                  uppercase={false}
                />
                <XPBadge points={pendingTasks.reduce((sum, t) => sum + t.points, 0)} size="sm" />
              </View>
              {renderTaskGroup(pendingTasks)}
            </View>
          )}

          {doneTasks.length > 0 && (
            <View
              style={[
                styles.section,
                !readOnly && pendingTasks.length > 0 && styles.sectionSpacing,
              ]}
            >
              {!readOnly && (
                <View style={styles.sectionHeader}>
                  <SectionTitle
                    label="Concluídas"
                    color={Colors.light.success}
                    fontSize={14}
                    fontWeight="700"
                    letterSpacing={-0.2}
                    uppercase={false}
                  />
                  <XPBadge
                    points={doneTasks.reduce((sum, t) => sum + t.points, 0)}
                    size="sm"
                    variant="done"
                  />
                </View>
              )}
              <View style={readOnly ? undefined : styles.sectionBodyDone}>
                {renderTaskGroup(doneTasks)}
              </View>
            </View>
          )}
        </View>
      </View>

      <CelebrationOverlay />
      <LevelUpOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.progressBar,
    borderRadius: 4,
  },
  progressCheck: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 12,
  },
  section: {
    paddingHorizontal: 4,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.light.accentPurpleSurface,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.accentPurple,
    letterSpacing: 0.2,
  },
  xpBadgeDone: {
    backgroundColor: 'rgba(88, 204, 2, 0.12)',
  },
  xpTextDone: {
    color: Colors.light.success,
  },
  sectionBodyDone: {
    opacity: 0.7,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
    marginHorizontal: 4,
  },
});
