import ZappIcon from '@/components/common/ZappIcon';
import { Cell, ListSection, SectionLabel } from '@/components/settings/SettingsList';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useInvitations } from '@/contexts/InvitationContext';
import logger from '@/lib/logger';
import { toast } from '@/lib/toast';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return <SettingsInner />;
}

function SettingsInner() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const { members, deleteFamilyMember, familyId, beginIntentionalExit, cancelIntentionalExit } =
    useFamily();
  const { sendInvitation, sentInvitations } = useInvitations();
  const router = useRouter();
  const { user, backendUserId, signOut, deleteAccount } = useAuth();
  const { showDialog } = useConfirmDialog();

  const currentUser = useMemo(() => {
    return members.find((m) => m.userId === backendUserId);
  }, [members, backendUserId]);

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
          await deleteAccount();
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

  const { top: statusBarHeight } = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={styles.headerFixed}>
        <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ZappIcon name="chevron-left" size={24} color={Colors.light.primary} />
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
        {isAdmin && (
          <>
            <SectionLabel text="CONVITES" />
            <ListSection>
              <Cell first last>
                <View style={styles.inviteBody}>
                  <View style={styles.inputBox}>
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
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        (!inviteEmail.trim() || inviteLoading) && styles.sendBtnDisabled,
                      ]}
                      onPress={handleInvite}
                      disabled={!inviteEmail.trim() || inviteLoading}
                      activeOpacity={0.5}
                    >
                      {inviteLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ZappIcon name="plus" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Cell>
              {sentInvitations.map((invitation, index) => (
                <Cell key={invitation.id} last={index === sentInvitations.length - 1}>
                  <View style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <ZappIcon name="email-outline" size={16} color={Colors.light.primary} />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {invitation.toEmail}
                      </Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {invitation.status === 'pending' ? 'Pendente' : invitation.status === 'accepted' ? 'Aceito' : 'Recusado'}
                      </Text>
                    </View>
                    <View style={[styles.invitationBadge, invitation.status === 'pending' ? styles.badgePending : invitation.status === 'accepted' ? styles.badgeAccepted : styles.badgeDeclined]}>
                      <Text style={styles.invitationBadgeText}>
                        {invitation.status === 'pending' ? 'Pendente' : invitation.status === 'accepted' ? 'Aceito' : 'Recusado'}
                      </Text>
                    </View>
                  </View>
                </Cell>
              ))}
            </ListSection>
          </>
        )}

        <SectionLabel text="MEMBROS" />

        <ListSection>
          {members.map((member, index) => (
            <Cell key={member.id} first={index === 0} last={index === members.length - 1}>
              <View style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{(member.name || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  {member.email ? (
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                  ) : null}
                </View>
                {isAdmin && member.userId !== backendUserId && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMember(member.id, member.name)}
                    disabled={deletingMember === member.id}
                    style={styles.removeBtn}
                    activeOpacity={0.5}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {deletingMember === member.id ? (
                      <ActivityIndicator size={14} color={Colors.light.danger} />
                    ) : (
                      <ZappIcon name="close" size={15} color={Colors.light.mutedText} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Cell>
          ))}
        </ListSection>

        <SectionLabel text="CONTA" />

        <ListSection>
          <Cell first onPress={handleSignOut} chevron>
            <View style={styles.actionRow}>
              <View style={styles.actionIcon}>
                <ZappIcon name="logout-variant" size={16} color={Colors.light.danger} />
              </View>
              <Text style={[styles.actionText, styles.textRed]}>Sair da conta</Text>
            </View>
          </Cell>
          <Cell last onPress={handleDeleteAccount} chevron disabled={deletingAccount}>
            <View style={styles.actionRow}>
              <View style={styles.actionIcon}>
                <ZappIcon name="account-remove-outline" size={16} color={Colors.light.danger} />
              </View>
              {deletingAccount ? (
                <ActivityIndicator size={16} color={Colors.light.danger} />
              ) : (
                <Text style={[styles.actionText, styles.textRed]}>Excluir conta</Text>
              )}
            </View>
          </Cell>
        </ListSection>
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
    paddingVertical: 6,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  headerRight: { width: 44 },
  content: { flex: 1 },
  contentContainer: { paddingTop: 16, paddingBottom: 40 },
  inviteBody: { width: '100%', paddingVertical: 2 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.light.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  memberInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  memberEmail: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  adminBadge: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 0.4,
  },
  invitationBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgePending: {
    backgroundColor: '#FFF3CD',
  },
  badgeAccepted: {
    backgroundColor: '#D4EDDA',
  },
  badgeDeclined: {
    backgroundColor: '#F8D7DA',
  },
  invitationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  removeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  textRed: { color: Colors.light.danger },
});
