import IconCircleButton from '@/components/common/IconCircleButton';
import ScreenHeader from '@/components/common/ScreenHeader';
import Colors from '@/constants/Colors';
import { StyleSheet, View } from 'react-native';

interface TasksScreenHeaderProps {
  hasTasks: boolean;
  onDeleteAll: () => void;
  onAdd: () => void;
}

export default function TasksScreenHeader({
  hasTasks,
  onDeleteAll,
  onAdd,
}: TasksScreenHeaderProps) {
  return (
    <ScreenHeader
      iconName="clipboard-check-outline"
      title="Tarefas"
      subtitle="Gerencie as tarefas da família"
      iconBackgroundColor={`${Colors.light.primary}12`}
      iconColor={Colors.light.primary}
      subtitleColor={Colors.light.mutedText}
      actions={
        <>
          {hasTasks && (
            <IconCircleButton
              iconName="delete-outline"
              onPress={onDeleteAll}
              size={44}
              backgroundColor="rgba(255, 59, 48, 0.12)"
              borderColor="rgba(255, 59, 48, 0.25)"
              iconColor={Colors.light.danger}
            />
          )}
          <IconCircleButton
            iconName="plus"
            onPress={onAdd}
            size={44}
            backgroundColor={Colors.light.primary}
            borderColor={Colors.light.primary}
            iconColor="#fff"
          />
        </>
      }
      footer={<View style={styles.footerDivider} />}
    />
  );
}

const styles = StyleSheet.create({
  footerDivider: {
    marginTop: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
});
