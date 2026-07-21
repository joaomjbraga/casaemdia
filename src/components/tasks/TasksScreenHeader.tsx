import IconCircleButton from "@/components/common/IconCircleButton";
import PrimaryIconButton from "@/components/common/PrimaryIconButton";
import ProgressBar from "@/components/common/ProgressBar";
import ScreenHeader from "@/components/common/ScreenHeader";
import Colors from "@/constants/Colors";
import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";

interface TasksScreenHeaderProps {
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  onDeleteAll: () => void;
  onAdd: () => void;
}

export default function TasksScreenHeader({
  completedTasks,
  totalTasks,
  progressPercentage,
  onDeleteAll,
  onAdd,
}: TasksScreenHeaderProps) {
  return (
    <ScreenHeader
      iconName="clipboard-check-outline"
      title="Tarefas"
      subtitle={`${completedTasks}/${totalTasks} concluídas`}
      iconBackgroundColor={Colors.light.accentPurpleSurface}
      iconColor={Colors.light.accentPurple}
      subtitleColor={Colors.light.mutedText}
      actions={
        <>
          {totalTasks > 0 && (
            <IconCircleButton
              iconName="delete-outline"
              onPress={onDeleteAll}
              size={44}
              backgroundColor="rgba(255, 59, 48, 0.12)"
              borderColor="rgba(255, 59, 48, 0.25)"
              iconColor={Colors.light.danger}
            />
          )}
          <PrimaryIconButton iconName="plus" onPress={onAdd} />
        </>
      }
      footer={
        <View style={styles.progressWrap}>
          <ProgressBar
            progress={progressPercentage / 100}
            height={8}
            color={Colors.light.progressBar}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginTop: 14,
  },
});
