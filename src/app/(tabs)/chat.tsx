import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { sendMessage, subscribeToMessages } from '@/services/chat';
import type { ChatMessage } from '@/types/models';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatListItem =
  | { id: string; type: 'date'; label: string }
  | { id: string; type: 'message'; message: ChatMessage };

export default function ChatScreen() {
  const { user } = useAuth();
  const { familyId, members } = useFamily();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const { top, bottom } = useSafeAreaInsets();
  const listBottomPadding = Math.max(24, bottom + 24);

  const groupedMessages = useMemo<ChatListItem[]>(() => {
    const groups: ChatListItem[] = [];
    let currentDateKey = '';

    messages.forEach((message) => {
      const createdAt = message.createdAt?.toDate?.() ?? message.createdAt;
      const dateKey = createdAt ? new Date(createdAt).toDateString() : 'unknown';

      if (dateKey !== currentDateKey) {
        const formatted = createdAt
          ? new Date(createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Hoje';
        groups.push({ id: `date-${dateKey}`, type: 'date', label: formatted });
        currentDateKey = dateKey;
      }

      groups.push({ id: message.id, type: 'message', message });
    });

    return groups;
  }, [messages]);

  useEffect(() => {
    if (!familyId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToMessages(familyId, (data) => {
      setMessages(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId]);

  useEffect(() => {
    if (messages.length === 0) return;

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: false,
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!familyId || !user || isSending) return;

      const senderName =
        members.find((member) => member.id === user.uid)?.name ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Alguém';

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        text,
        senderId: user.uid,
        senderName,
        createdAt: new Date(),
        status: 'sending',
      };

      setMessages((current) => [...current, optimisticMessage]);
      setIsSending(true);

      try {
        await sendMessage({
          familyId,
          text,
          senderId: user.uid,
          senderName,
        });
        setMessages((current) =>
          current.map((item) => (item.id === tempId ? { ...item, status: 'sent' } : item)),
        );
      } catch {
        setMessages((current) =>
          current.map((item) => (item.id === tempId ? { ...item, status: 'error' } : item)),
        );
      } finally {
        setIsSending(false);
      }
    },
    [familyId, user, members, isSending],
  );

  const handleBack = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Área da Status Bar */}
        <View style={{ height: top }} />

        {/* Conteúdo do Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ZappIcon name="arrow-left" size={20} color={Colors.light.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chat</Text>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Conteúdo */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? top : 0}
      >
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === 'date') {
              return (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>{item.label}</Text>
                </View>
              );
            }

            if (!item.message) {
              return null;
            }

            return <MessageBubble message={item.message} isOwn={item.message.senderId === user?.uid} />;
          }}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && styles.listEmpty,
            { paddingBottom: listBottomPadding },
          ]}
          ListEmptyComponent={
            <EmptyState
              iconName="chat-outline"
              title="Nenhuma mensagem"
              subtitle="Inicie a conversa com sua família ou use uma ação rápida"
            />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListFooterComponent={<View style={[styles.listFooter, { height: listBottomPadding / 2 }]} />}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({
                animated: false,
              });
            }
          }}
        />

        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          bottomInset={bottom}
          quickActions={[
            { label: 'Tarefa', value: 'Tarefa: ' },
            { label: 'Compras', value: 'Compras: ' },
          ]}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  headerContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },

  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.inputBackground,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },

  headerSpacer: {
    width: 40,
  },

  keyboardView: {
    flex: 1,
  },

  listContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    textTransform: 'capitalize',
    backgroundColor: `${Colors.light.cardBackground}`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  listFooter: {
    height: 12,
  },
});
