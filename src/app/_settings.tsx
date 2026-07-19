import Aurora from "@/components/shared/ui/aurora";
import {
  useConfirmDialog,
} from "@/components/shared/ui/dialog/ConfirmDialog";
import { Glow } from "@/components/shared/ui/glow";
import { Toast } from "@/components/shared/ui/toast";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import { useInvitations } from "@/contexts/InvitationContext";
import { db } from "@/lib/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import IconCircleButton from "@/components/common/IconCircleButton";
import SectionTitle from "@/components/common/SectionTitle";

const colors = Colors.light;

export default function SettingsScreen() {
  return (
    <SettingsInner />
  );
}

function SettingsInner() {
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  const {
    familyMembers,
    loading: memberLoading,
    deleteFamilyMember,
    fetchFamilyMembers,
  } = useFamilyMembers();
  const { familyId, familyName, members } = useFamily();
  const { sendInvitation } = useInvitations();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showDialog } = useConfirmDialog();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const currentUser = useMemo(() => {
    return members.find((m) => m.id === user?.uid);
  }, [members, user?.uid]);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        } catch {
          Toast.show("Não foi possível remover o membro.", { type: "error" });
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

          const membersSnap = await getDocs(
            collection(db, "families", familyId, "members"),
          );
          const accountMembers = membersSnap.docs.map((d) => ({
            id: d.id,
            role: d.data().role as string,
          }));

          if (accountMembers.length === 1) {
            const subcollections = ["tasks", "shopping_list"];
            for (const sub of subcollections) {
              const snap = await getDocs(
                collection(db, "families", familyId, sub),
              );
              for (const d of snap.docs) await deleteDoc(d.ref);
            }
            const invSnap = await getDocs(
              query(
                collection(db, "invitations"),
                where("familyId", "==", familyId),
              ),
            );
            for (const d of invSnap.docs) await deleteDoc(d.ref);
            await deleteDoc(doc(db, "families", familyId));
          } else {
            const currentUserMember = membersSnap.docs.find(
              (d) => d.id === user.uid,
            );
            if (currentUserMember?.data().role === "admin") {
              const nextAdmin = accountMembers.find((m) => m.id !== user.uid);
              if (nextAdmin) {
                await updateDoc(
                  doc(db, "families", familyId, "members", nextAdmin.id),
                  { role: "admin" },
                );
              }
            }
            await deleteDoc(
              doc(db, "families", familyId, "members", user.uid),
            );
          }

          await deleteDoc(doc(db, "users", user.uid));
          await signOut();
          router.replace("/(auth)/login");
        } catch {
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
    return StatusBar.currentHeight || 24;
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      <View style={styles.auroraWrapper}>
        <Aurora
          height={280}
          auroraColors={["#A259FF", "#60EFFF", "#00FF87"]}
          skyColors={["#0a0e1a", "#0D1B2A"]}
          speed={0.3}
          intensity={0.6}
          waveDirection={[4, -3]}
        />
      </View>
      <View style={styles.auroraOverlay} />

      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <IconCircleButton
          iconName="arrow-left"
          onPress={() => router.back()}
          size={40}
          backgroundColor="rgba(255, 255, 255, 0.08)"
          borderColor="rgba(96, 239, 255, 0.15)"
          iconColor="#FFFFFF"
        />
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View style={styles.section}>
            <SectionTitle label="PERFIL" color="rgba(96, 239, 255, 0.7)" />
            <LinearGradient
              colors={["rgba(13, 27, 42, 0.88)", "rgba(22, 27, 34, 0.95)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.profileBorder}>
                <View style={styles.profileRow}>
                  {user?.photoURL ? (
                    <Image
                      source={{ uri: user.photoURL }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <MaterialCommunityIcons
                        name="account"
                        size={28}
                        color="#00FF87"
                      />
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user?.displayName || "Usuário"}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>
                  <View
                    style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        isAdmin && styles.roleBadgeTextAdmin,
                      ]}
                    >
                      {isAdmin ? "Admin" : "Membro"}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <SectionTitle label={"FAMÍLIA — " + familyName} color="rgba(96, 239, 255, 0.7)" />

            {isAdmin && (
              <LinearGradient
                colors={["rgba(13, 27, 42, 0.88)", "rgba(22, 27, 34, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardBorder}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.cardIcon,
                        {
                          backgroundColor: "rgba(162, 89, 255, 0.12)",
                          borderColor: "rgba(162, 89, 255, 0.25)",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="email-fast-outline"
                        size={22}
                        color="#A259FF"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardLabel}>Convidar por Email</Text>
                      <Text style={styles.cardHint}>
                        Envie um convite para outra pessoa
                      </Text>
                    </View>
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
                  <Text style={styles.inviteHint}>
                    O convidado precisa ter o app instalado e estar logado com este email
                  </Text>
                  <Glow color="#A259FF" intensity={0.5} size={4}>
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        (!inviteEmail.trim() || inviteLoading) &&
                          styles.btnDisabled,
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
                          <Text style={styles.primaryBtnText}>
                            Enviar Convite
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Glow>
                </View>
              </LinearGradient>
            )}

            {members.length > 0 && (
              <LinearGradient
                colors={["rgba(13, 27, 42, 0.88)", "rgba(22, 27, 34, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { marginTop: 12 }]}
              >
                <View style={styles.cardBorder}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.cardIcon,
                        {
                          backgroundColor: "rgba(96, 239, 255, 0.12)",
                          borderColor: "rgba(96, 239, 255, 0.25)",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-group"
                        size={22}
                        color="#60EFFF"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardLabel}>
                        {members.length} Membro{members.length !== 1 ? "s" : ""}
                      </Text>
                      <Text style={styles.cardHint}>
                        {isAdmin
                          ? "Toque no × para remover"
                          : "Membros da família"}
                      </Text>
                    </View>
                  </View>

                  {members.map((member, index) => (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        index < members.length - 1 && styles.memberRowBorder,
                      ]}
                    >
                      <View style={styles.memberLeft}>
                        {member.photoURL ? (
                          <Image
                            source={{ uri: member.photoURL }}
                            style={styles.memberAvatarImage}
                          />
                        ) : (
                          <View style={styles.memberAvatar}>
                            <MaterialCommunityIcons
                              name="account"
                              size={16}
                              color="#60EFFF"
                            />
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name}
                          </Text>
                          {member.email ? (
                            <Text style={styles.memberEmail} numberOfLines={1}>
                              {member.email}
                            </Text>
                          ) : null}
                        </View>
                        {member.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <MaterialCommunityIcons
                              name="shield-crown"
                              size={12}
                              color="#FFC300"
                            />
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      {isAdmin && member.id !== user?.uid && (
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteMember(member.id, member.name)
                          }
                          disabled={deletingMember === member.id}
                          style={styles.removeBtn}
                          activeOpacity={0.6}
                        >
                          {deletingMember === member.id ? (
                            <ActivityIndicator
                              size={16}
                              color={colors.danger}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={22}
                              color={colors.danger}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </LinearGradient>
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle label="CONTA" color="rgba(96, 239, 255, 0.7)" />

            <Glow color="#F85149" intensity={0.5} size={4}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["rgba(13, 27, 42, 0.88)", "rgba(22, 27, 34, 0.95)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionBorder}>
                    <View style={styles.actionLeft}>
                      <View
                        style={[
                          styles.actionIcon,
                          {
                            backgroundColor: "rgba(248, 81, 73, 0.12)",
                            borderColor: "rgba(248, 81, 73, 0.25)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="logout-variant"
                          size={20}
                          color="#F85149"
                        />
                      </View>
                      <Text style={styles.actionText}>Sair da Conta</Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.mutedText}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Glow>

            <Glow color="#F85149" intensity={0.5} size={4}>
              <TouchableOpacity
                style={[styles.actionBtn, { marginTop: 12 }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["rgba(13, 27, 42, 0.88)", "rgba(22, 27, 34, 0.95)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionBorder}>
                    <View style={styles.actionLeft}>
                      <View
                        style={[
                          styles.actionIcon,
                          {
                            backgroundColor: "rgba(248, 81, 73, 0.12)",
                            borderColor: "rgba(248, 81, 73, 0.25)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-remove-outline"
                          size={20}
                          color="#F85149"
                        />
                      </View>
                      <Text style={styles.actionText}>Excluir Conta</Text>
                    </View>
                    {deletingAccount ? (
                      <ActivityIndicator size={18} color={colors.danger} />
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.mutedText}
                      />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Glow>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Casa em Dia v1.0.0</Text>
            <Text style={styles.footerSubtext}>{familyName}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  statusBarSpacer: {},
  auroraWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: "hidden",
  },
  auroraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 14, 26, 0.4)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 28 },
  profileCard: { borderRadius: 20, overflow: "hidden" },
  profileBorder: {
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.12)",
    borderRadius: 20,
    padding: 20,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0, 255, 135, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 135, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 135, 0.3)",
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.65)",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(96, 239, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.2)",
  },
  roleBadgeAdmin: {
    backgroundColor: "rgba(255, 195, 0, 0.12)",
    borderColor: "rgba(255, 195, 0, 0.3)",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(96, 239, 255, 0.8)",
  },
  roleBadgeTextAdmin: { color: "#FFC300" },
  card: { borderRadius: 20, overflow: "hidden" },
  cardBorder: {
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.12)",
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardHint: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.55)",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 17, 23, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 0.6)",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inviteHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 14,
    marginLeft: 4,
  },
  memberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    paddingVertical: 14,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(48, 54, 61, 0.5)",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(96, 239, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(96, 239, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  memberAvatarImage: { width: 36, height: 36, borderRadius: 11, flexShrink: 0 },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  memberEmail: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(96, 239, 255, 0.45)",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 195, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.2)",
    flexShrink: 0,
  },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFC300" },
  removeBtn: { padding: 4 },
  actionBtn: { overflow: "hidden", borderRadius: 20 },
  actionGradient: { borderRadius: 20 },
  actionBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(248, 81, 73, 0.12)",
    borderRadius: 20,
    padding: 18,
  },
  actionLeft: { flexDirection: "row", alignItems: "center" },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F85149",
    letterSpacing: -0.1,
  },
  footer: { alignItems: "center", paddingVertical: 24 },
  footerDivider: {
    width: 40,
    height: 2,
    backgroundColor: "rgba(96, 239, 255, 0.15)",
    borderRadius: 1,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(96, 239, 255, 0.35)",
    letterSpacing: 0.5,
  },
});
