import Avatar from "@/components/common/Avatar";
import { useConfirmDialog } from "@/components/shared/ui/dialog/ConfirmDialog";
import { Toast } from "@/components/shared/ui/toast";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import { useInvitations } from "@/contexts/InvitationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { deleteUserAccountFromFamily } from "../services/account";

const colors = Colors.light;

export default function SettingsScreen() {
  return <SettingsInner />;
}

function SettingsInner() {
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  const {
    familyMembers,
    loading: memberLoading,
    deleteFamilyMember,
    fetchFamilyMembers,
  } = useFamilyMembers();
  const { familyId, familyName, members, beginIntentionalExit, cancelIntentionalExit } =
    useFamily();
  const { sendInvitation } = useInvitations();
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { showDialog } = useConfirmDialog();

  const currentUser = useMemo(() => {
    return members.find((m) => m.id === user?.uid);
  }, [members, user?.uid]);

  const isAdmin = currentUser?.role === "admin";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Toast.show("Digite o email do convidado.", { type: "error" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Toast.show("Email inválido.", { type: "error" });
      return;
    }
    if (inviteEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      Toast.show("Você não pode convidar a si mesmo.", { type: "error" });
      return;
    }
    try {
      setInviteLoading(true);
      await sendInvitation(inviteEmail.trim());
      setInviteEmail("");
      Toast.show("Convite enviado!", { type: "success" });
    } catch (error: any) {
      Toast.show(error.message || "Falha ao enviar convite.", {
        type: "error",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    showDialog({
      title: "Remover Membro",
      message: `Remover "${memberName}" da família?`,
      type: "danger",
      confirmText: "Remover",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setDeletingMember(memberId);
          if (!familyId) throw new Error("Família não carregada");

          await deleteFamilyMember(memberId);
          Toast.show(`${memberName} foi removido.`, { type: "success" });
        } catch (error: any) {
          console.error("Erro ao remover membro:", error);
          Toast.show(
            error?.message || "Não foi possível remover o membro.",
            { type: "error" },
          );
        } finally {
          setDeletingMember(null);
        }
      },
    });
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid || !familyId) return;
    showDialog({
      title: "Excluir Conta",
      message: "Isso removerá seus dados da família. Continuar?",
      type: "danger",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setDeletingAccount(true);
          beginIntentionalExit();

          await deleteUserAccountFromFamily({
            familyId,
            userId: user.uid,
            deleteAccount,
          });

          router.replace("/(auth)/login");
        } catch (error) {
          cancelIntentionalExit();
          console.error("Erro ao excluir conta:", error);
          Toast.show("Falha ao excluir conta.", { type: "error" });
        } finally {
          setDeletingAccount(false);
        }
      },
    });
  };

  const handleSignOut = async () => {
    showDialog({
      title: "Sair",
      message: "Tem certeza que deseja sair?",
      type: "danger",
      confirmText: "Sair",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await signOut();
          router.replace("/(auth)/login");
        } catch {
          Toast.show("Falha ao fazer logout.", { type: "error" });
        }
      },
    });
  };

  const statusBarHeight = useMemo(() => {
    return StatusBar.currentHeight || (Platform.OS === "ios" ? 44 : 24);
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerRight} />
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
            borderColor="rgba(255, 255, 255, 0.12)"
            backgroundColor="rgba(255, 255, 255, 0.06)"
            iconName="account"
            iconColor="#FFFFFF"
            iconSize={32}
          />
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.displayName || "Usuário"}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email}
          </Text>
          <View style={[styles.rolePill, isAdmin && styles.rolePillAdmin]}>
            <Text
              style={[styles.rolePillText, isAdmin && styles.rolePillTextAdmin]}
            >
              {isAdmin ? "Administrador" : "Membro"}
            </Text>
          </View>
        </View>

        <SectionLabel text={"Família · " + familyName} />

        <ListSection>
          {isAdmin && (
            <Cell first last={!members.length}>
              <View style={styles.inviteBody}>
                <View style={styles.inviteRow}>
                  <MaterialCommunityIcons
                    name="email-fast-outline"
                    size={22}
                    color="#A259FF"
                  />
                  <Text style={styles.inviteTitle}>Convidar por email</Text>
                </View>
                <View style={styles.inputBox}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={18}
                    color={colors.mutedText}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.memberInput}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="email@exemplo.com"
                    placeholderTextColor={colors.mutedText}
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
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="send"
                        size={18}
                        color="#fff"
                      />
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
                  borderColor="rgba(255, 255, 255, 0.1)"
                  backgroundColor="rgba(255, 255, 255, 0.06)"
                  iconName="account"
                  iconColor="#FFFFFF"
                  iconSize={18}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    {member.role === "admin" && (
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
                      <ActivityIndicator size={16} color={colors.danger} />
                    ) : (
                      <MaterialCommunityIcons
                        name="close"
                        size={20}
                        color={colors.danger}
                      />
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
                <MaterialCommunityIcons
                  name="logout-variant"
                  size={20}
                  color="#FF453A"
                />
              </View>
              <Text style={[styles.actionText, styles.textRed]}>
                Sair da conta
              </Text>
            </View>
          </Cell>
          <Cell
            first={false}
            last
            onPress={handleDeleteAccount}
            chevron
            disabled={deletingAccount}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIcon, styles.iconRed]}>
                <MaterialCommunityIcons
                  name="account-remove-outline"
                  size={20}
                  color="#FF453A"
                />
              </View>
              {deletingAccount ? (
                <ActivityIndicator size={18} color="#FF453A" />
              ) : (
                <Text style={[styles.actionText, styles.textRed]}>
                  Excluir conta
                </Text>
              )}
            </View>
          </Cell>
        </ListSection>

        <Text style={styles.footer}>Casa em Dia</Text>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function ListSection({ children }: { children: React.ReactNode }) {
  return <View style={styles.listSection}>{children}</View>;
}

function Cell({
  children,
  first,
  last,
  onPress,
  chevron,
  disabled,
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  onPress?: () => void;
  chevron?: boolean;
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.cell,
        first && styles.cellFirst,
        last && styles.cellLast,
        onPress && styles.cellPressable,
        disabled && styles.cellDisabled,
      ]}
    >
      <TouchableOpacity
        style={styles.cellTouch}
        onPress={onPress}
        disabled={!onPress || disabled}
        activeOpacity={0.6}
      >
        <View
          style={[
            styles.cellInner,
            last && styles.cellInnerLast,
          ]}
        >
          {children}
          {chevron && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="rgba(255, 255, 255, 0.3)"
              style={styles.cellChevron}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  statusBarSpacer: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRight: { width: 44 },
  content: { flex: 1 },
  contentContainer: { paddingVertical: 20, paddingBottom: 40 },
  profileBlock: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 14,
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  rolePill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  rolePillAdmin: {
    backgroundColor: "rgba(255, 195, 0, 0.14)",
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  rolePillTextAdmin: { color: "#FFC300" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  listSection: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    overflow: "hidden",
  },
  cell: {
    backgroundColor: "transparent",
  },
  cellPressable: {},
  cellDisabled: { opacity: 0.5 },
  cellFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cellLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cellTouch: { flex: 1 },
  cellInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  cellInnerLast: {
    borderBottomWidth: 0,
  },
  cellChevron: { marginLeft: "auto" },
  inviteBody: { width: "100%", paddingVertical: 4 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  memberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#FFFFFF",
    paddingVertical: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A84FF",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  memberEmail: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 1,
  },
  adminBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 195, 0, 0.14)",
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFC300",
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconRed: {
    backgroundColor: "rgba(255, 69, 58, 0.16)",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  textRed: { color: "#FF453A" },
  footer: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.3)",
    marginTop: 32,
  },
});
