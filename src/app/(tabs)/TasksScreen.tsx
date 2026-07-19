import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TasksCard from "../../components/TasksCard";
import LoadingContainer from "../../components/common/LoadingContainer";
import IconCircleButton from "../../components/common/IconCircleButton";
import PrimaryIconButton from "../../components/common/PrimaryIconButton";
import Colors from "../../constants/Colors";
import { db } from "../../lib/firebase";
import { sendNotificationToFamily } from "../../lib/onesignal";

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
}

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

    const tasksQuery = query(
      collection(db, "families", familyId, "tasks"),
      orderBy("created_at", "desc"),
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const data: Task[] = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        done: d.data().done,
        assignee: d.data().assignee,
        points: d.data().points,
      }));

      setTasks(data);
      setTasksLoading(false);
      setRefreshing(false);
    }, () => {
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
      const ref = doc(db, "families", familyId, "tasks", id);
      await updateDoc(ref, { done: newDone });

      const userName = user.displayName || user.email?.split("@")[0] || "Alguem";
      await sendNotificationToFamily({
        familyId,
        excludeUserId: user.uid,
        title: newDone ? "Tarefa concluida" : "Tarefa reaberta",
        body: newDone
          ? `${userName} concluiu a tarefa "${task.title}"`
          : `${userName} reabriu a tarefa "${task.title}"`,
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
      const ref = doc(db, "families", familyId, "tasks", id);
      await deleteDoc(ref);

      const userName = user.displayName || user.email?.split("@")[0] || "Alguem";
      sendNotificationToFamily({
        familyId,
        excludeUserId: user.uid,
        title: "Tarefa removida",
        body: `${userName} removeu a tarefa "${deletedTask?.title ?? "tarefa"}"`,
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
          const batch = writeBatch(db);
          for (const task of previousTasks) {
            batch.delete(doc(db, "families", familyId!, "tasks", task.id));
          }
          await batch.commit();

          if (user) {
            const userName = user.displayName || user.email?.split("@")[0] || "Alguem";
            sendNotificationToFamily({
              familyId,
              excludeUserId: user.uid,
              title: "Tarefas limpas",
              body: `${userName} removeu todas as tarefas`,
            });
          }
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
    return <LoadingContainer fullScreen={false} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#0E2436", "#000000"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity activeOpacity={0.7}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={26}
                color="#60EFFF"
              />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Tarefas</Text>
            <Text style={styles.headerSubtitle}>
              {completedTasks}/{totalTasks} concluídas
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {totalTasks > 0 && (
            <IconCircleButton
              iconName="delete-outline"
              onPress={handleDeleteAll}
              size={44}
              backgroundColor="rgba(248, 81, 73, 0.12)"
              borderColor="rgba(248, 81, 73, 0.25)"
              iconColor="#F85149"
            />
          )}
          <PrimaryIconButton iconName="plus" onPress={openAdd} />
        </View>
      </View>

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
    backgroundColor: "#000000",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    opacity: 0.9,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 22,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(96, 239, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(96, 239, 255, 0.85)",
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140,
  },
});
