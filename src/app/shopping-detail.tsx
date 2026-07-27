import BackHeader from '@/components/common/BackHeader';
import PrimaryActionButton from '@/components/common/PrimaryActionButton';
import ZappIcon from '@/components/common/ZappIcon';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Badge from '@/components/tasks/Badge';
import Card from '@/components/tasks/Card';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { toast } from '@/lib/toast';
import { toggleShoppingItem } from '@/services/shopping';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const getItemIcon = (name?: string) => {
  const lower = (name ?? '').toLowerCase();
  if (lower.includes('fruta') || lower.includes('banana') || lower.includes('maçã') || lower.includes('laranja') || lower.includes('uva')) {
    return 'food-apple';
  }
  if (lower.includes('verdura') || lower.includes('alface') || lower.includes('tomate') || lower.includes('cebola') || lower.includes('cenoura')) {
    return 'carrot';
  }
  if (lower.includes('carne') || lower.includes('frango') || lower.includes('peixe') || lower.includes('ovo')) {
    return 'food-drumstick';
  }
  if (lower.includes('leite') || lower.includes('queijo') || lower.includes('iogurte') || lower.includes('manteiga')) {
    return 'cow';
  }
  if (lower.includes('pão') || lower.includes('biscoito') || lower.includes('bolo') || lower.includes('torrada')) {
    return 'bread-slice';
  }
  if (lower.includes('limpeza') || lower.includes('detergente') || lower.includes('sabão') || lower.includes('alvejante')) {
    return 'spray-bottle';
  }
  if (lower.includes('remédio') || lower.includes('medicamento') || lower.includes('farmácia')) {
    return 'pill';
  }
  return 'basket';
};

const getIconColor = (name?: string) => {
  const lower = (name ?? '').toLowerCase();
  if (lower.includes('fruta') || lower.includes('verdura')) return '#16A34A';
  if (lower.includes('carne') || lower.includes('frango')) return '#DC2626';
  if (lower.includes('limpeza')) return '#009394';
  if (lower.includes('remédio')) return '#7C3AED';
  return '#D97706';
};

export default function ShoppingDetailScreen() {
  const params = useLocalSearchParams<{
    itemId: string;
    name: string;
    done: string;
    quantity: string;
    assignee: string;
    assigneeId: string;
  }>();
  const { familyId, members } = useFamily();
  const { backendUserId } = useAuth();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  const isDone = params.done === 'true';
  const hasQuantity = !!params.quantity;
  const hasAssignee = !!params.assigneeId;
  const currentMemberId = members.find((m) => m.userId === backendUserId)?.id;
  const isResponsible = Boolean(
    params.assigneeId && backendUserId && (currentMemberId === params.assigneeId || backendUserId === params.assigneeId)
  );
  const canToggle = isResponsible;
  const itemIcon = getItemIcon(params.name);
  const itemIconColor = getIconColor(params.name);

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
  }, [contentOpacity, contentTranslateY]);

  const handleToggle = () => {
    if (!familyId || !params.itemId) return;

    showDialog({
      title: isDone ? 'Marcar como pendente?' : 'Marcar como comprado?',
      message: `Alterar o status de "${params.name}"?`,
      type: 'success',
      confirmText: isDone ? 'Marcar pendente' : 'Marcar comprado',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await toggleShoppingItem({
            familyId,
            itemId: params.itemId,
            item: {
              id: params.itemId,
              name: params.name,
              done: isDone,
              quantity: params.quantity ?? '',
              assigneeId: params.assigneeId || undefined,
              assignee: params.assignee,
            },
            newDone: !isDone,
          });
          toast.success(isDone ? 'Item marcado como pendente.' : 'Item marcado como comprado.');
          router.back();
        } catch {
          showAlert({
            title: 'Erro',
            message: 'Não foi possível atualizar o item.',
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <BackHeader />

      <Animated.View
        style={[
          styles.content,
          { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
        ]}
      >
        <View style={styles.iconSection}>
          <View
            style={[
              styles.iconCircle,
              isDone && styles.iconCircleDone,
              { backgroundColor: isDone ? Colors.light.success : `${itemIconColor}12` },
            ]}
          >
            <ZappIcon
              name={isDone ? 'basket-check' : itemIcon}
              size={32}
              color={isDone ? '#fff' : itemIconColor}
            />
          </View>
        </View>

        <Text style={styles.title}>{params.name}</Text>

        <Badge
          label={isDone ? 'Comprado' : 'Pendente'}
          variant={isDone ? 'success' : 'warning'}
          size="md"
          style={styles.statusBadge}
        />

        <Card variant="elevated" padding={20} style={styles.detailsCard}>
          {hasQuantity && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <ZappIcon name="tag-outline" size={18} color={Colors.light.mutedText} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Observação</Text>
                <Text style={styles.detailValue}>{params.quantity}</Text>
              </View>
            </View>
          )}

          <View style={[styles.detailRow, !hasQuantity && styles.detailRowFirst]}>
            <View style={styles.detailIcon}>
              <ZappIcon name="account-outline" size={18} color={Colors.light.mutedText} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Responsável</Text>
              <Text style={styles.detailValue}>{params.assignee || 'Sem responsável'}</Text>
            </View>
          </View>
        </Card>

        {canToggle ? (
          <PrimaryActionButton
            title={isDone ? 'Marcar como pendente' : 'Marcar como comprado'}
            icon={isDone ? 'refresh' : 'check'}
            onPress={handleToggle}
            color={Colors.light.success}
            style={styles.actionBtn}
          />
        ) : (
          <View style={styles.lockedBanner}>
            <ZappIcon name="lock-outline" size={16} color={Colors.light.mutedText} />
            <Text style={styles.lockedText}>
              {hasAssignee
                ? `Apenas ${params.assignee} pode alterar este item.`
                : 'Apenas o responsável pode alterar este item.'}
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
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  detailRowFirst: {
    marginTop: 0,
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
  },
  actionBtn: {
    width: '100%',
    marginBottom: 12,
  },
  lockedBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  lockedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
    lineHeight: 18,
  },
});
