import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import { useInvitations } from "@/contexts/InvitationContext";
import { db } from "@/lib/firebase";
import { sendNotificationToFamily } from "@/lib/onesignal";
import { creditCompletion, revertCompletion } from "@/lib/gamification";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import RankingCard from "../../components/RankingCard";
import TasksCard from "../../components/TasksCard";
import IconCircleButton from "../../components/common/IconCircleButton";

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
}

interface CoupleStat {
  id: string;
  name: string;
  points: number;
  avatar: "person" | "person-outline" | "trophy";
  tasksCompleted: number;
  photoURL?: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { familyId } = useFamily();
  const {
    familyMembers,
    fetchFamilyMembers,
    loading: familyMembersLoading,
  } = useFamilyMembers();
  const { pendingInvitations, acceptInvitation, declineInvitation } =
    useInvitations();
  const { showAlert } = useAlertDialog();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  const coupleStats = useMemo(() => {
    const stats: { [key: string]: CoupleStat } = {};
    familyMembers.forEach((member, index) => {
      stats[member.id] = {
        id: member.id,
        name: member.name,
        points: member.points,
        avatar: index % 2 === 0 ? "person" : "person-outline",
        tasksCompleted: member.tasksCompleted + member.shoppingCompleted,
        photoURL: member.photoURL,
      };
    });
    return stats;
  }, [familyMembers]);

  const fetchTasks = useCallback(async () => {
    if (!familyId) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);

    try {
      const tasksQuery = query(
        collection(db, "families", familyId, "tasks"),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(tasksQuery);
      const data: Task[] = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        done: d.data().done,
        assignee: d.data().assignee,
        points: d.data().points,
      }));
      setTasks(data);
    } catch (error) {
      showAlert({
        title: "Erro",
        message: "Não foi possível carregar as tarefas.",
        type: "error",
      });
    } finally {
      setTasksLoading(false);
    }
  }, [familyId]);

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        fetchTasks();
        fetchFamilyMembers();
      }
    }, [familyId, fetchTasks, fetchFamilyMembers]),
  );

  const toggleTask = async (id: string) => {
    if (!familyId) {
      showAlert({
        title: "Erro",
        message: "Família não encontrada.",
        type: "error",
      });
      return;
    }

    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      return prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    });
    const task = snapshot.find((t) => t.id === id);
    if (!task) return;

    try {
      const taskRef = doc(db, "families", familyId, "tasks", id);
      await updateDoc(taskRef, { done: !task.done });

      const newDone = !task.done;

      // Gamificação: credita/estorna pontos no membro responsável.
      try {
        if (newDone) {
          await creditCompletion(familyId, task.assignee, {
            points: task.points,
            task: true,
          });
        } else {
          await revertCompletion(familyId, task.assignee, {
            points: task.points,
            task: true,
          });
        }
      } catch (gamificationError) {
        console.error("Erro ao atualizar gamificação (tarefa):", gamificationError);
      }

      if (user) {
        const userName =
          user.displayName || user.email?.split("@")[0] || "Alguem";
        sendNotificationToFamily({
          familyId,
          excludeUserId: user.uid,
          title: newDone ? "Tarefa concluida" : "Tarefa reaberta",
          body: newDone
            ? `${userName} concluiu a tarefa "${task.title}"`
            : `${userName} reabriu a tarefa "${task.title}"`,
        });
      }
    } catch (error) {
      setTasks(() => snapshot);
      showAlert({
        title: "Erro",
        message: "Não foi possível atualizar a tarefa.",
        type: "error",
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (!familyId) {
      showAlert({
        title: "Erro",
        message: "Família não encontrada.",
        type: "error",
      });
      return;
    }

    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.filter((t) => t.id !== id);
    });

    try {
      const taskRef = doc(db, "families", familyId, "tasks", id);
      await deleteDoc(taskRef);
    } catch (error) {
      setTasks(() => snapshot);
      showAlert({
        title: "Erro",
        message: "Não foi possível excluir a tarefa.",
        type: "error",
      });
    }
  };

  const isLoading =
    authLoading || tasksLoading || familyMembersLoading || !familyId;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: Colors.light.background }]}
      >
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={[styles.loadingText, { color: Colors.light.mutedText }]}>
            Carregando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.light.background }]}
    >
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header totalTasks={totalTasks} completedTasks={completedTasks} />

        {pendingInvitations.map((inv) => (
          <View key={inv.id} style={styles.inviteBanner}>
            <View style={styles.inviteIcon}>
              <MaterialCommunityIcons
                name="account-plus"
                size={20}
                color="#A259FF"
              />
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
                backgroundColor="rgba(63, 185, 80, 0.2)"
                borderColor="rgba(63, 185, 80, 0.3)"
                iconColor="#FFFFFF"
              />
              <IconCircleButton
                iconName="close"
                onPress={() => declineInvitation(inv.id)}
                size={36}
                backgroundColor="rgba(248, 81, 73, 0.2)"
                borderColor="rgba(248, 81, 73, 0.3)"
                iconColor="#FFFFFF"
              />
            </View>
          </View>
        ))}

        <RankingCard coupleStats={coupleStats} />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140,
  },
  inviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(162, 89, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(162, 89, 255, 0.25)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 12,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(162, 89, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteInfo: {
    flex: 1,
    minWidth: 0,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  inviteHint: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.65)",
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
});
