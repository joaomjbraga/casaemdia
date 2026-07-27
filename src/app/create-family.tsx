import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { fetchPendingInvitationsApi, createFamilyApi, acceptInvitationApi, declineInvitationApi } from '@/services/family-api';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import type { Invitation } from '@/types/models';

interface Family {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  chatClearedAt: string | null;
}

interface JoinRequest {
  id: string;
  familyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CreateFamilyScreen() {
  const { user } = useAuth();
  const { familyId, refreshFamily } = useFamily();
  const { showAlert } = useAlertDialog();
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [searchFamily, setSearchFamily] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (familyId) {
      router.replace('/(tabs)');
    }
  }, [familyId]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshFamily();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshFamily]);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, famRes, reqRes] = await Promise.all([
          fetchPendingInvitationsApi(),
          api.family.getAll(),
          api.joinRequests.listPendingByUser(),
        ]);
        setInvitations(invRes as Invitation[]);
        setFamilies((famRes as any).families ?? []);
        setMyRequests((reqRes as any).requests ?? []);
      } catch {
        // ignore
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    try {
      await createFamilyApi(familyName.trim());
      await refreshFamily();
    } catch (err: any) {
      showAlert({ title: 'Erro', message: err?.message || 'Erro ao criar família', type: 'error' });
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await acceptInvitationApi(invitationId);
      await refreshFamily();
    } catch (err: any) {
      showAlert({ title: 'Erro', message: err?.message || 'Erro ao aceitar convite', type: 'error' });
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await declineInvitationApi(invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestJoin = async (familyId: string) => {
    setActionLoading(familyId);
    try {
      await api.joinRequests.send(familyId);
      const res = await api.joinRequests.listPendingByUser();
      setMyRequests((res as any).requests ?? []);
      showAlert({ title: 'Sucesso', message: 'Pedido enviado! Aguarde a resposta do administrador.', type: 'info' });
    } catch (err: any) {
      showAlert({ title: 'Erro', message: err?.message || 'Erro ao enviar pedido', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.joinRequests.cancel(requestId);
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const requestedFamilyIds = new Set(myRequests.map((r) => r.familyId));
  const filteredFamilies = families.filter((f) =>
    f.name.toLowerCase().includes(searchFamily.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.greeting}>Olá, {displayName.split(' ')[0]}!</Text>
            <Text style={styles.subtitle}>
              Você ainda não pertence a uma família.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Criar família</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Nome da família"
                placeholderTextColor={Colors.light.mutedText}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              <TouchableOpacity
                onPress={handleCreate}
                disabled={loading || !familyName.trim()}
                style={[styles.createButton, (loading || !familyName.trim()) && styles.actionDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.light.textWhite} />
                ) : (
                  <Text style={styles.createButtonText}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!dataLoading && invitations.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Convites pendentes</Text>
              {invitations.map((inv) => (
                <View key={inv.id} style={styles.listRow}>
                  <View style={styles.listRowInfo}>
                    <Text style={styles.listRowTitle}>{inv.familyName}</Text>
                    <Text style={styles.listRowSubtitle}>
                      Expira em: {new Date(inv.expiresAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.listRowActions}>
                    <TouchableOpacity
                      onPress={() => handleAccept(inv.id)}
                      disabled={actionLoading === inv.id}
                      style={[styles.acceptButton, actionLoading === inv.id && styles.actionDisabled]}
                    >
                      <Text style={styles.acceptButtonText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDecline(inv.id)}
                      disabled={actionLoading === inv.id}
                      style={[styles.declineButton, actionLoading === inv.id && styles.actionDisabled]}
                    >
                      <Text style={styles.declineButtonText}>Recusar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!dataLoading && myRequests.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Seus pedidos enviados</Text>
              {myRequests.map((req) => {
                const fam = families.find((f) => f.id === req.familyId);
                return (
                  <View key={req.id} style={styles.listRow}>
                    <View style={styles.listRowInfo}>
                      <Text style={styles.listRowTitle}>{fam?.name ?? 'Família'}</Text>
                      <Text style={styles.listRowSubtitle}>Aguardando resposta do admin</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCancelRequest(req.id)}
                      disabled={actionLoading === req.id}
                      style={[styles.declineButton, actionLoading === req.id && styles.actionDisabled]}
                    >
                      <Text style={styles.declineButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {!dataLoading && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Entrar em família existente</Text>
              <TextInput
                value={searchFamily}
                onChangeText={setSearchFamily}
                placeholder="Buscar família pelo nome..."
                placeholderTextColor={Colors.light.mutedText}
                style={[styles.input, { marginBottom: 12 }]}
              />
              {filteredFamilies.length === 0 ? (
                <Text style={styles.emptyText}>
                  {families.length === 0 ? 'Nenhuma família disponível' : 'Nenhuma família encontrada'}
                </Text>
              ) : (
                filteredFamilies.map((fam) => {
                  const alreadyRequested = requestedFamilyIds.has(fam.id);
                  return (
                    <View key={fam.id} style={styles.listRow}>
                      <View style={styles.listRowInfo}>
                        <Text style={styles.listRowTitle}>{fam.name}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRequestJoin(fam.id)}
                        disabled={actionLoading === fam.id || alreadyRequested}
                        style={[
                          styles.requestButton,
                          alreadyRequested && styles.requestButtonSent,
                          actionLoading === fam.id && styles.actionDisabled,
                        ]}
                      >
                        <Text style={[styles.requestButtonText, alreadyRequested && styles.requestButtonTextSent]}>
                          {actionLoading === fam.id ? '...' : alreadyRequested ? 'Enviado' : 'Solicitar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
  },
  greeting: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.light.mutedText,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.inputBackground,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.text,
  },
  createButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  createButtonText: {
    color: Colors.light.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  listRowInfo: {
    flex: 1,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  listRowSubtitle: {
    fontSize: 12,
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  listRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${Colors.light.success}15`,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.success,
  },
  declineButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${Colors.light.danger}15`,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  requestButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${Colors.light.primary}15`,
  },
  requestButtonSent: {
    backgroundColor: `${Colors.light.mutedText}15`,
  },
  requestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  requestButtonTextSent: {
    color: Colors.light.mutedText,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.mutedText,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
