import type { Task } from "@/types/models";
import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TasksCard from "@/components/tasks/TasksCard";
import TasksScreenHeader from "@/components/tasks/TasksScreenHeader";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import Colors from "@/constants/Colors";
import { DOCK_CLEARANCE } from "@/constants/Layout";
import {
  deleteAllTasks,
  deleteTask as deleteTaskRecord,
  subscribeToTasks,
  toggleTaskCompletion,
} from "@/services/tasks";


export default function TasksScreen() {
  const { user } = useAuth();
  const { familyId } = useFamily();
  const { showAlert } = useAlertDialog();
  const { showDialog } = useConfirmDialog();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  const completedTasks = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    if (!familyId) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    const unsubscribe = subscribeToTasks(familyId, (data) => {
      setTasks(data as Task[]);
      setTasksLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
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
          userName: user.displayName || user.email?.split("@")[0] || "Alguem",
          userId: user.uid,
        },
      });
    } catch {
      setTasks(() => snapshot);
      showAlert({
        title: "Erro",
        message: "Nao foi possivel atualizar a tarefa.",
        type: "error",
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (!familyId || !user) return;

    const deletedTask = tasks.find((t) => t.id === id);
    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.filter((t) => t.id !== id);
    });

    try {
      await deleteTaskRecord({
        familyId,
        taskId: id,
        title: deletedTask?.title,
        options: {
          userName: user.displayName || user.email?.split("@")[0] || "Alguem",
          userId: user.uid,
        },
      });
    } catch {
      setTasks(() => snapshot);
      showAlert({
        title: "Erro",
        message: "Não foi possível excluir a tarefa.",
        type: "error",
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const openAdd = () => router.push("/AddTaskScreen");

  const handleDeleteAll = async () => {
    if (!familyId || tasks.length === 0) return;

    showDialog({
      title: "Excluir todas as tarefas",
      message: `Remover todas as ${tasks.length} tarefa(s)?`,
      type: "danger",
      confirmText: "Excluir todas",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const previousTasks = tasksRef.current;
        setTasks([]);

        try {
          await deleteAllTasks({
            familyId: familyId!,
            tasks: previousTasks,
            options: user
              ? {
                  userName:
                    user.displayName || user.email?.split("@")[0] || "Alguem",
                  userId: user.uid,
                }
              : undefined,
          });
        } catch {
          setTasks(() => previousTasks);
          showAlert({
            title: "Erro",
            message: "Não foi possível excluir as tarefas.",
            type: "error",
          });
        }
      },
    });
  };

  if (tasksLoading && tasks.length === 0) {
    return <LoadingSkeleton variant="tasks" />;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerSpacer} />

      <TasksScreenHeader
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        progressPercentage={progressPercentage}
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
        <TasksCard
          tasks={tasks}
          progressPercentage={progressPercentage}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
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
    paddingBottom: DOCK_CLEARANCE,
  },
});
