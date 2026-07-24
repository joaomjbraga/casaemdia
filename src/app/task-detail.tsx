import Colors from '@/constants/Colors';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { toggleTaskCompletion } from '@/services/tasks';
import { toast } from '@/lib/toast';
import BackHeader from '@/components/common/BackHeader';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import PrimaryActionButton from '@/components/common/PrimaryActionButton';
import ZappIcon from '@/components/common/ZappIcon';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{
    taskId: string;
    title: string;
    assignee: string;
    assigneeId: string;
    done: string;
  }>();
  const { familyId } = useFamily();
  const { user } = useAuth();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const isDone = params.done === 'true';
  const isOwner = user?.uid === params.assigneeId;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (isDone) {
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 120,
      }).start();
    }
  }, [contentOpacity, contentTranslateY, checkScale, isDone]);

  const handleComplete = () => {
    if (!familyId || !params.taskId) return;

    showDialog({
      title: 'Concluir tarefa?',
      message: `Marcar "${params.title}" como concluída?`,
      type: 'success',
      confirmText: 'Concluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await toggleTaskCompletion({
            familyId,
            taskId: params.taskId,
            task: {
              id: params.taskId,
              title: params.title,
              done: false,
              assignee: params.assignee,
              assigneeId: params.assigneeId,
            },
            newDone: true,
            options: {
              userName: user?.displayName || user?.email?.split('@')[0] || 'Alguém',
              userId: user?.uid || '',
            },
          });
          toast.success('Tarefa concluída!');
          router.back();
        } catch {
          showAlert({
            title: 'Erro',
            message: 'Não foi possível concluir a tarefa.',
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <BackHeader />

      <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, isDone && styles.iconCircleDone]}>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <ZappIcon
                name={isDone ? 'check' : 'checkbox-blank-circle-outline'}
                size={32}
                color={isDone ? '#fff' : Colors.light.mutedText}
              />
            </Animated.View>
          </View>
        </View>

        <Text style={styles.title}>{params.title}</Text>

        <Badge
          label={isDone ? 'Concluída' : 'Pendente'}
          variant={isDone ? 'success' : 'warning'}
          size="md"
          style={styles.statusBadge}
        />

        <Card variant="elevated" padding={20} style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <ZappIcon name="account-outline" size={18} color={Colors.light.mutedText} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Responsável</Text>
              <Text style={styles.detailValue}>{params.assignee}</Text>
            </View>
          </View>
        </Card>

        {!isDone && isOwner && (
          <PrimaryActionButton
            title="Concluir Tarefa"
            icon="check"
            onPress={handleComplete}
            color={Colors.light.success}
            style={styles.actionBtn}
          />
        )}

        {!isDone && !isOwner && (
          <View style={styles.lockedBanner}>
            <ZappIcon name="lock-outline" size={16} color={Colors.light.mutedText} />
            <Text style={styles.lockedText}>
              Apenas {params.assignee} pode concluir esta tarefa
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconSection: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconCircleDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  statusBadge: {
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  actionBtn: {
    width: '100%',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.mutedText,
    flex: 1,
  },
});
