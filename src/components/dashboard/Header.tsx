import IconCircleButton from '@/components/common/IconCircleButton';
import ZappIcon from '@/components/common/ZappIcon';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
  const { user, signOut } = useAuth();
  const { familyName, members } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const { top: statusBarHeight } = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  statusBarSpacer: {
    backgroundColor: Colors.light.backgroundSecondary,
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
});
