import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { useCelebration } from "@/hooks/useCelebration";
import { toast } from "@/lib/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Colors from "../constants/Colors";
import EmptyState from "./common/EmptyState";
import SectionTitle from "./common/SectionTitle";
import TaskCard from "./tasks/TaskCard";

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
}

interface TasksListProps {
  tasks: Task[];
  toggleTask: (id: string) => Promise<void>;
  deleteTask?: (id: string) => Promise<void>;
  maxHeight?: number;
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
}

export default function TasksList({
  tasks,
  toggleTask,
  deleteTask,
  maxHeight = 400,
  progressPercentage: propProgress,
  completedTasks: propCompleted,
  totalTasks: propTotal,
}: TasksListProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const { showDialog } = useConfirmDialog();
  const { celebrate, CelebrationOverlay } = useCelebration();

  const completedCount = propCompleted ?? tasks.filter((t) => t.done).length;
  const totalCount = propTotal ?? tasks.length;
  const progressPercentage =
    propProgress ?? (totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
  const isComplete = totalCount > 0 && completedCount === totalCount;

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
  }, [progressPercentage]);

  useEffect(() => {
    Animated.timing(checkOpacity, {
      toValue: isComplete ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isComplete]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const handleToggle = async (taskId: string) => {
    if (loadingTaskId === taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    const willCompleteAll =
      !!task && !task.done && totalCount >= 1 && completedCount === totalCount - 1;
    setLoadingTaskId(taskId);
    try {
      await toggleTask(taskId);
      if (willCompleteAll) celebrate();
    } catch {
      toast.error("Não foi possível alterar a tarefa.");
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
      title: "Excluir Tarefa",
      message: `Remover "${task.title}"?`,
      type: "danger",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteTask(taskId);
        } catch {
          toast.error("Não foi possível excluir.");
        }
      },
    });
  };

  const renderTaskGroup = (groupTasks: Task[]) =>
    groupTasks.map((task, index) => (
      <View key={task.id}>
        <TaskCard
          title={task.title}
          done={task.done}
          assignee={task.assignee}
          points={task.points}
          onToggle={() => handleToggle(task.id)}
          onDelete={() => handleDelete(task.id)}
          isLoading={isTaskLoading(task.id)}
        />
        {index < groupTasks.length - 1 && <View style={styles.separator} />}
      </View>
    ));

  if (tasks.length === 0) {
    return (
      <View style={styles.card}>
        <EmptyState
          iconName="checkbox-marked-outline"
          title="Nenhuma tarefa"
          subtitle="Crie tarefas para começar"
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
            <Animated.View
              style={[styles.progressFill, { width: animatedWidth }]}
            />
          </View>
          <Animated.View
            style={[styles.progressCheck, { opacity: checkOpacity }]}
          >
            <MaterialCommunityIcons
              name="check"
              size={12}
              color={Colors.light.success}
            />
          </Animated.View>
        </View>
      </View>

      <View style={styles.list}>
        {pendingTasks.length > 0 && (
          <View style={styles.section}>
          <SectionTitle label="Pendentes" color={Colors.light.mutedText} />
            {renderTaskGroup(pendingTasks)}
          </View>
        )}

        {doneTasks.length > 0 && (
          <View
            style={[
              styles.section,
              pendingTasks.length > 0 && styles.sectionSpacing,
            ]}
          >
            <SectionTitle label="Concluídas" color={Colors.light.mutedText} />
            <View style={styles.sectionBodyDone}>
              {renderTaskGroup(doneTasks)}
            </View>
          </View>
        )}
      </View>
      </View>

      <CelebrationOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.success,
    borderRadius: 2,
  },
  progressCheck: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 12,
  },
  section: {},
  sectionSpacing: {
    marginTop: 16,
  },
  sectionBodyDone: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 8,
    marginHorizontal: 4,
  },
});
