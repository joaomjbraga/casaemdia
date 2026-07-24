import IconCircleButton from '@/components/common/IconCircleButton';
import ZappIcon from '@/components/common/ZappIcon';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  totalTasks?: number;
  completedTasks?: number;
  onStatsPress?: (filter: 'pending' | 'done') => void;
}

type FilterTab = 'pending' | 'done';

export default function Header({ onStatsPress }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { familyName, members } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const { top: statusBarHeight } = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');

  const currentUser = members.find((m) => m.id === user?.uid);
  const isAdmin = currentUser?.role === 'admin';

  const userInitial = (user?.displayName || user?.email || '?')[0].toUpperCase();

  const handleLogout = useCallback(() => {
    showDialog({
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair?',
      type: 'danger',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setIsLoggingOut(true);
          await signOut();
          router.replace('/(auth)/login');
        } catch (error) {
          showAlert({
            title: 'Erro',
            message: 'Não foi possível sair da conta. Tente novamente.',
            type: 'error',
          });
        } finally {
          setIsLoggingOut(false);
        }
      },
    });
  }, [signOut, showDialog, showAlert]);

  const handleOpenSettings = useCallback(() => {
    router.push('/_settings');
  }, []);

  const handleTabPress = useCallback(
    (tab: FilterTab) => {
      setActiveTab(tab);
      onStatsPress?.(tab);
    },
    [onStatsPress],
  );

  const membersCount = members?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      <View style={styles.bar}>
        <View style={styles.brandSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{userInitial}</Text>
          </View>
          <View style={styles.appTitleContainer}>
            <Text style={styles.appName} numberOfLines={1}>
              {familyName || 'Casa em Dia'}
            </Text>
            <Text style={styles.appSubtitle}>
              {membersCount} {membersCount === 1 ? 'membro' : 'membros'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <IconCircleButton
            iconName="cog-outline"
            onPress={handleOpenSettings}
            iconColor={Colors.light.mutedText}
            size={34}
            backgroundColor={Colors.light.cardDark}
            borderColor={Colors.light.border}
          />

          <IconCircleButton
            iconName="logout-variant"
            onPress={handleLogout}
            disabled={isLoggingOut}
            iconColor={Colors.light.danger}
            size={34}
            backgroundColor={Colors.light.cardDark}
            borderColor={Colors.light.border}
          />
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <SegmentButton
          label="A fazer"
          icon="clipboard-list-outline"
          active={activeTab === 'pending'}
          onPress={() => handleTabPress('pending')}
        />
        <SegmentButton
          label="Concluídas"
          icon="check-circle-outline"
          active={activeTab === 'done'}
          onPress={() => handleTabPress('done')}
        />
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.segmentTouchable}
    >
      <Animated.View
        style={[
          styles.segmentButton,
          active && styles.segmentButtonActive,
          { transform: [{ scale }] },
        ]}
      >
        <ZappIcon
          name={icon as any}
          size={14}
          color={active ? Colors.light.text : Colors.light.mutedText}
        />
        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  statusBarSpacer: {
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 52,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
    marginRight: 12,
  },
  appTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.mutedText,
    letterSpacing: 0.1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 3,
    gap: 3,
  },
  segmentTouchable: {
    flex: 1,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
    letterSpacing: 0.1,
  },
  segmentLabelActive: {
    color: Colors.light.text,
    fontWeight: '700',
  },
});
