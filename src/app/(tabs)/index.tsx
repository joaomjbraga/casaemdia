import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import Colors from "@/constants/Colors";
import { DOCK_CLEARANCE } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import type { CoupleStat, Task } from "@/types/models";

import IconCircleButton from "@/components/common/IconCircleButton";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import Header from "@/components/dashboard/Header";
import RankingCard from "@/components/dashboard/RankingCard";
import TasksCard from "@/components/tasks/TasksCard";
import { useInvitations } from "@/contexts/InvitationContext";
import { fetchDashboardTasks } from "@/services/tasks";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { familyId } = useFamily();
  const { members, fetchMembers, loading: membersLoading } = useFamily();
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
    members.forEach((member, index) => {
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
  }, [members]);

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
        fetchMembers();
      }
    }, [familyId, fetchTasks, fetchMembers]),
  );

  const isLoading =
    authLoading ||
    (!familyId && membersLoading) ||
    (familyId && tasksLoading && tasks.length === 0 && members.length === 0);

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.light.background }]}
    >
      <StatusBar style="dark" />

      <Header totalTasks={totalTasks} completedTasks={completedTasks} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {pendingInvitations.map((inv) => (
          <View key={inv.id} style={styles.inviteBanner}>
            <View style={styles.inviteIcon}>
              <MaterialCommunityIcons
                name="account-plus"
                size={20}
                color={Colors.light.accentPurple}
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

        <RankingCard coupleStats={coupleStats} currentUserId={user?.uid} />
        <TasksCard
          tasks={tasks}
          progressPercentage={progressPercentage}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          readOnly
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: DOCK_CLEARANCE,
  },
  inviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.accentPurpleSurface,
    borderWidth: 1,
    borderColor: "rgba(175, 82, 222, 0.15)",
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
    backgroundColor: "rgba(175, 82, 222, 0.1)",
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
    color: Colors.light.text,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  inviteHint: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.mutedText,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
});
