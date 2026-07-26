import IconCircleButton from '@/components/common/IconCircleButton';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Colors from '@/constants/Colors';
import { FamilyRelationLabels } from '@/constants/FamilyRelationLabels';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
  const { user, backendUserId, signOut } = useAuth();
  const { familyName, members } = useFamily();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();

  const { top: statusBarHeight } = useSafeAreaInsets();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentUser = members.find((member) => member.userId === backendUserId);
  const isAdmin = currentUser?.role === 'admin';
  const currentUserRelationLabel = currentUser?.familyRelation
    ? FamilyRelationLabels[currentUser.familyRelation as keyof typeof FamilyRelationLabels]
    : null;

  const userInitial = (user?.displayName || user?.email || '?')[0].toUpperCase();

  const membersCount = members.length;

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
        } catch {
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

  return (
    <View style={styles.container}>
      {/* Área da Status Bar */}
      <View style={{ height: statusBarHeight }} />

      {/* Header */}
      <View style={styles.bar}>
        <View style={styles.brandSection}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.userAvatarImage} contentFit="cover" />
          ) : (
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{userInitial}</Text>
            </View>
          )}

          <View style={styles.appTitleContainer}>
            <Text style={styles.appName} numberOfLines={1}>
              {familyName || 'Casa em Dia'}
            </Text>

            <Text style={styles.appSubtitle}>
              {membersCount} {membersCount === 1 ? 'membro' : 'membros'}
            </Text>
            {currentUserRelationLabel ? (
              <Text style={styles.appRelation} numberOfLines={1}>
                Você: {currentUserRelationLabel}
              </Text>
            ) : null}
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

  bar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  brandSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },

  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  userAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  userInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
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

  appRelation: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    letterSpacing: 0.1,
  },

  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
