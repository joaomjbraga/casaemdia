import Avatar from '@/components/common/Avatar';
import { Cell, ListSection, SectionLabel } from '@/components/settings/SettingsList';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import logger from '@/lib/logger';
import { toast } from '@/lib/toast';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useInvitations } from '@/contexts/InvitationContext';
import ZappIcon from '@/components/common/ZappIcon';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteUserAccountFromFamily } from '../services/account';

export default function SettingsScreen() {
  return <SettingsInner />;
}

function SettingsInner() {
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  const {
    members,
    loading: memberLoading,
    deleteFamilyMember,
    fetchMembers,
    familyId,
    familyName,
    beginIntentionalExit,
    cancelIntentionalExit,
  } = useFamily();
  const { sendInvitation } = useInvitations();
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { showDialog } = useConfirmDialog();

  const currentUser = useMemo(() => {
    return members.find((m) => m.id === user?.uid);
  }, [members, user?.uid]);

  const isAdmin = currentUser?.role === 'admin';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite o email do convidado.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Email inválido.');
      return;
    }
    if (inviteEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('Você não pode convidar a si mesmo.');
      return;
    }
    try {
      setInviteLoading(true);
      await sendInvitation(inviteEmail.trim());
      setInviteEmail('');
      toast.success('Convite enviado!');
    } catch (error: any) {
      toast.error(error.message || 'Falha ao enviar convite.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    showDialog({
      title: 'Remover Membro',
      message: `Remover "${memberName}" da família?`,
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setDeletingMember(memberId);
          if (!familyId) throw new Error('Família não carregada');

          await deleteFamilyMember(memberId);
          toast.success(`${memberName} foi removido.`);
        } catch (error: any) {
          logger.error('Erro ao remover membro:', error);
          toast.error(error?.message || 'Não foi possível remover o membro.');
        } finally {
          setDeletingMember(null);
        }
      },
    });
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid || !familyId) return;
    showDialog({
      title: 'Excluir Conta',
      message: 'Isso removerá seus dados da família. Continuar?',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setDeletingAccount(true);
          beginIntentionalExit();

          await deleteUserAccountFromFamily({
            familyId,
            userId: user.uid,
            deleteAccount,
          });

          router.replace('/(auth)/login');
        } catch (error) {
          cancelIntentionalExit();
          logger.error('Erro ao excluir conta:', error);
          toast.error('Falha ao excluir conta.');
        } finally {
          setDeletingAccount(false);
        }
      },
    });
  };

  const handleSignOut = async () => {
    showDialog({
      title: 'Sair',
      message: 'Tem certeza que deseja sair?',
      type: 'danger',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await signOut();
          router.replace('/(auth)/login');
        } catch {
          toast.error('Falha ao fazer logout.');
        }
      },
    });
  };

  const statusBarHeight = useMemo(() => {
    return StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 24);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.headerFixed}>
        <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ZappIcon name="chevron-left" size={28} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileBlock}>
          <Avatar
            photoURL={user?.photoURL}
            size={64}
            borderRadius={20}
            borderColor={isAdmin ? Colors.light.accentPurple : Colors.light.border}
            borderWidth={isAdmin ? 2 : 1}
            backgroundColor={Colors.light.cardDark}
            iconName="account"
            iconColor={Colors.light.primary}
            iconSize={32}
          />
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.displayName || 'Usuário'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email}
          </Text>
          <View style={[styles.rolePill, isAdmin && styles.rolePillAdmin]}>
            <Text style={[styles.rolePillText, isAdmin && styles.rolePillTextAdmin]}>
              {isAdmin ? 'Administrador' : 'Membro'}
            </Text>
          </View>
        </View>

        <SectionLabel text={'Família · ' + familyName} />

        <ListSection>
          {isAdmin && (
            <Cell first last={!members.length}>
              <View style={styles.inviteBody}>
                <View style={styles.inviteRow}>
                  <ZappIcon name="email-fast-outline" size={22} color={Colors.light.accentPurple} />
                  <Text style={styles.inviteTitle}>Convidar por email</Text>
                </View>
                <View style={styles.inputBox}>
                  <ZappIcon
                    name="email-outline"
                    size={18}
                    color={Colors.light.mutedText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.memberInput}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="email@exemplo.com"
                    placeholderTextColor={Colors.light.mutedText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (!inviteEmail.trim() || inviteLoading) && styles.btnDisabled,
                  ]}
                  onPress={handleInvite}
                  disabled={!inviteEmail.trim() || inviteLoading}
                  activeOpacity={0.7}
                >
                  {inviteLoading ? (
                    <ActivityIndicator size="small" color={Colors.light.text} />
                  ) : (
                    <>
                      <ZappIcon name="send" size={18} color={Colors.light.text} />
                      <Text style={styles.primaryBtnText}>Enviar convite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Cell>
          )}

          {members.map((member, index) => (
            <Cell
              key={member.id}
              first={index === 0 && !isAdmin}
              last={index === members.length - 1}
            >
              <View style={styles.memberRow}>
                <Avatar
                  photoURL={member.photoURL}
                  size={38}
                  borderRadius={12}
                  borderColor={
                    member.role === 'admin' ? Colors.light.accentPurple : Colors.light.border
                  }
                  borderWidth={member.role === 'admin' ? 2 : 1}
                  backgroundColor={Colors.light.cardDark}
                  iconName="account"
                  iconColor={Colors.light.primary}
                  iconSize={18}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  {member.email ? (
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                  ) : null}
                </View>
                {isAdmin && member.id !== user?.uid && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMember(member.id, member.name)}
                    disabled={deletingMember === member.id}
                    style={styles.removeBtn}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {deletingMember === member.id ? (
                      <ActivityIndicator size={16} color={Colors.light.danger} />
                    ) : (
                      <ZappIcon name="close" size={20} color={Colors.light.danger} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Cell>
          ))}
        </ListSection>

        <SectionLabel text="Conta" />

        <ListSection>
          <Cell first last={false} onPress={handleSignOut} chevron>
            <View style={styles.actionRow}>
              <View style={[styles.actionIcon, styles.iconRed]}>
                <ZappIcon name="logout-variant" size={20} color={Colors.light.danger} />
              </View>
              <Text style={[styles.actionText, styles.textRed]}>Sair da conta</Text>
            </View>
          </Cell>
          <Cell first={false} last onPress={handleDeleteAccount} chevron disabled={deletingAccount}>
            <View style={styles.actionRow}>
              <View style={[styles.actionIcon, styles.iconRed]}>
                <ZappIcon name="account-remove-outline" size={20} color={Colors.light.danger} />
              </View>
              {deletingAccount ? (
                <ActivityIndicator size={18} color={Colors.light.danger} />
              ) : (
                <Text style={[styles.actionText, styles.textRed]}>Excluir conta</Text>
              )}
            </View>
          </Cell>
        </ListSection>

        <Text style={styles.footer}>Casa em Dia</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  statusBarSpacer: {},
  headerFixed: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: { width: 44 },
  content: { flex: 1 },
  contentContainer: { paddingTop: 8, paddingBottom: 40 },
  profileBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 14,
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  rolePill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.light.cardDark,
  },
  rolePillAdmin: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  rolePillTextAdmin: { color: Colors.light.warning },
  inviteBody: { width: '100%', paddingVertical: 4 },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  memberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.light.text,
    paddingVertical: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  memberEmail: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.light.mutedText,
    marginTop: 1,
  },
  adminBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconRed: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  textRed: { color: Colors.light.danger },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 32,
  },
});
