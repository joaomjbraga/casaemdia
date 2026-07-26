import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import CameraCapture from '@/components/chat/CameraCapture';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ZappIcon from '@/components/common/ZappIcon';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
  sendMessage,
  subscribeToMessages,
  deleteChatMessage,
  clearChatMessages,
} from '@/services/chat';
import type { ChatMessage } from '@/types/models';
import logger from '@/lib/logger';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatListItem =
  | { id: string; type: 'date'; label: string }
  | { id: string; type: 'message'; message: ChatMessage };

const showError = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    alert(message);
  }
};

export default function ChatScreen() {
  const { user, backendUserId } = useAuth();
  const { familyId, members } = useFamily();
  const confirmDialog = useConfirmDialog();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingTime, setRecordingTime] = useState(0);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const { top, bottom } = useSafeAreaInsets();
  const listBottomPadding = Math.max(24, bottom + 24);

  const currentUserMember = useMemo(
    () => members.find((member) => member.userId === backendUserId),
    [members, backendUserId],
  );
  const isAdmin = currentUserMember?.role === 'admin';

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

    const unsubscribe = subscribeToMessages(familyId, (data: ChatMessage[]) => {
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

  useEffect(() => {
    if (!isRecordingAudio) {
      setRecordingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingTime((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const handleSend = useCallback(
    async (text: string, attachment?: ChatMessage['attachment']) => {
      if (!familyId || !user || isSending) return;

      const memberSelf = members.find((member) => member.userId === backendUserId);
      const senderName =
        memberSelf?.name ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Alguém';

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        text,
        senderId: memberSelf?.id ?? backendUserId ?? user.uid,
        senderName,
        createdAt: new Date(),
        status: 'sending',
        attachment,
      };

      logger.debug('[Chat] handleSend', {
        familyId,
        textLen: text.length,
        hasAttachment: !!attachment,
        attachmentType: attachment?.type,
      });

      setMessages((current) => [...current, optimisticMessage]);
      setIsSending(true);

      try {
        const sentMessage = await sendMessage(familyId, text, attachment);
        if (sentMessage?.id) {
          setMessages((current) =>
            current.map((item) =>
              item.id === tempId ? { ...sentMessage, status: 'sent' as const } : item,
            ),
          );
        } else {
          setMessages((current) =>
            current.map((item) => (item.id === tempId ? { ...item, status: 'sent' as const } : item)),
          );
        }
      } catch (error) {
        logger.error('[Chat] handleSend error', error);
        setMessages((current) =>
          current.map((item) => (item.id === tempId ? { ...item, status: 'error' } : item)),
        );
      } finally {
        setIsSending(false);
      }
    },
    [familyId, user, members, isSending],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!familyId || !user) return;

      const message = messages.find((item) => item.id === messageId);
      if (!message) return;

      const memberSelf = members.find((m) => m.userId === backendUserId);
      const canDelete = message.senderId === memberSelf?.id || isAdmin;
      if (!canDelete) {
        showError('Você não pode excluir esta mensagem.');
        return;
      }

      if (messageId.startsWith('temp-')) {
        setMessages((current) => current.filter((item) => item.id !== messageId));
        return;
      }

      try {
        await deleteChatMessage(familyId, messageId);
        setMessages((current) => current.filter((item) => item.id !== messageId));
      } catch (error) {
        logger.error('[Chat] handleDeleteMessage error', error);
        showError('Não foi possível excluir a mensagem.');
      }
    },
    [familyId, user, isAdmin, messages],
  );

  const handleClearChat = useCallback(async () => {
    if (!familyId || !user || clearingChat || !isAdmin) return;

    setClearingChat(true);
    try {
      const result = await clearChatMessages(familyId);
      if (result.cleared === false) {
        showError('Chat já foi limpo hoje.');
        return;
      }

      setMessages([]);
      showError('Chat limpo com sucesso.');
    } catch (error) {
      logger.error('[Chat] handleClearChat error', error);
      showError('Não foi possível limpar o chat.');
    } finally {
      setClearingChat(false);
    }
  }, [familyId, user, clearingChat, isAdmin]);

  const handleClearChatRequest = useCallback(() => {
    if (!familyId || !isAdmin) return;

    confirmDialog.showDialog({
      title: 'Limpar chat',
      message:
        'Essa ação vai apagar todas as mensagens deste chat. Essa ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Limpar',
      cancelText: 'Cancelar',
      onConfirm: handleClearChat,
    });
  }, [familyId, isAdmin, confirmDialog, handleClearChat]);

  const handlePickImage = useCallback(async () => {
    if (!familyId || !user || isSending || uploadingMedia) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Permissão de galeria negada. Habilite nas configurações do app.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    logger.debug('[Chat] handlePickImage asset', {
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setUploadingMedia(true);

    try {
      const uploaded = await uploadToCloudinary(
        asset.uri,
        asset.fileName || `image-${Date.now()}.jpg`,
        asset.mimeType,
      );
      logger.info('[Chat] handlePickImage upload success', uploaded);
      await handleSend('', {
        url: uploaded.url,
        type: 'image',
        name: asset.fileName || 'image',
        mimeType: asset.mimeType,
        publicId: uploaded.publicId,
      });
    } catch (error) {
      logger.error('[Chat] handlePickImage error', error);
      showError('Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setUploadingMedia(false);
    }
  }, [familyId, user, isSending, uploadingMedia, handleSend]);

  const handlePickAudio = useCallback(async () => {
    if (!familyId || !user || isSending || uploadingMedia) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });

    if (!('assets' in result) || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    logger.debug('[Chat] handlePickAudio asset', {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
    });
    setUploadingMedia(true);

    try {
      const uploaded = await uploadToCloudinary(
        asset.uri,
        asset.name || `audio-${Date.now()}.m4a`,
        asset.mimeType,
      );
      logger.info('[Chat] handlePickAudio upload success', uploaded);
      await handleSend('', {
        url: uploaded.url,
        type: 'audio',
        name: asset.name || 'audio',
        mimeType: asset.mimeType,
        publicId: uploaded.publicId,
      });
    } catch (error) {
      logger.error('[Chat] handlePickAudio error', error);
      showError('Não foi possível enviar o áudio. Tente novamente.');
    } finally {
      setUploadingMedia(false);
    }
  }, [familyId, user, isSending, uploadingMedia, handleSend]);

  const handleCancelRecording = useCallback(() => {
    if (recorder) {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    setRecordingUri(null);
    setIsRecordingAudio(false);
    setRecordingTime(0);
  }, [recorder]);

  const handleToggleAudioRecording = useCallback(async () => {
    if (!familyId || !user || isSending || uploadingMedia) return;

    if (isRecordingAudio) {
      try {
        if (recorder) {
          await recorder.stop();
          const uri = recorder.uri;
          if (uri) {
            setRecordingUri(uri);
            setUploadingMedia(true);
            try {
              logger.debug('[Chat] handleToggleAudioRecording upload start', { uri });
              const uploaded = await uploadToCloudinary(
                uri,
                `audio-${Date.now()}.m4a`,
                'audio/m4a',
              );
              logger.info('[Chat] handleToggleAudioRecording upload success', uploaded);
              await handleSend('', {
                url: uploaded.url,
                type: 'audio',
                name: 'audio.m4a',
                mimeType: 'audio/m4a',
                publicId: uploaded.publicId,
              });
            } catch (error) {
              logger.error('[Chat] handleToggleAudioRecording error', error);
              showError('Não foi possível enviar o áudio. Tente novamente.');
            } finally {
              setUploadingMedia(false);
              setRecordingUri(null);
            }
          }
        }
      } finally {
        setIsRecordingAudio(false);
      }
      return;
    }

    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        showError('Permissão de microfone negada. Habilite nas configurações do app.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingUri(null);
      setIsRecordingAudio(true);
    } catch (error) {
      logger.error('[Chat] handleToggleAudioRecording record error', error);
      showError('Não foi possível iniciar a gravação.');
    }
  }, [familyId, user, isSending, uploadingMedia, isRecordingAudio, handleSend, recorder]);

  const handleBack = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleCapture = useCallback(
    async (uri: string) => {
      if (!familyId || !user || isSending || uploadingMedia) return;

      logger.debug('[Chat] handleCapture asset', { uri });
      setUploadingMedia(true);

      try {
        const uploaded = await uploadToCloudinary(uri, `image-${Date.now()}.jpg`, 'image/jpeg');
        logger.info('[Chat] handleCapture upload success', uploaded);
        await handleSend('', {
          url: uploaded.url,
          type: 'image',
          name: 'image',
          mimeType: 'image/jpeg',
          publicId: uploaded.publicId,
        });
      } catch (error) {
        logger.error('[Chat] handleCapture error', error);
        showError('Não foi possível enviar a imagem. Tente novamente.');
      } finally {
        setUploadingMedia(false);
      }
    },
    [familyId, user, isSending, uploadingMedia, handleSend],
  );

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerContainer}>
        <View style={{ height: top }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ZappIcon name="arrow-left" size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          {isAdmin ? (
            <TouchableOpacity
              style={[styles.clearButton, clearingChat && styles.clearButtonActive]}
              onPress={handleClearChatRequest}
              activeOpacity={0.7}
              disabled={clearingChat}
            >
              <Text style={styles.clearButtonText}>{clearingChat ? 'Limpando...' : 'Limpar'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

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

            return (
              <MessageBubble
                message={item.message}
                isOwn={item.message.senderId === currentUserMember?.id}
                onDelete={handleDeleteMessage}
              />
            );
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
          ListFooterComponent={
            <View style={[styles.listFooter, { height: listBottomPadding / 2 }]} />
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({
                animated: false,
              });
            }
          }}
        />

        {isRecordingAudio ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Gravando {recordingTime}s</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelRecordingButton}
              onPress={handleCancelRecording}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelRecordingText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ChatInput
          onSend={(text) => handleSend(text)}
          disabled={isSending}
          bottomInset={bottom}
          onPickImage={handlePickImage}
          onPickAudio={handlePickAudio}
          onToggleAudioRecording={handleToggleAudioRecording}
          onPickCamera={() => setShowCamera(true)}
          uploading={uploadingMedia}
          isRecordingAudio={isRecordingAudio}
        />
      </KeyboardAvoidingView>

      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
      />
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
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: `${Colors.light.danger}1a`,
    borderWidth: 1,
    borderColor: `${Colors.light.danger}44`,
  },
  clearButtonActive: {
    opacity: 0.7,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.danger,
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
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4d4f',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cancelRecordingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${Colors.light.primary}16`,
  },
  cancelRecordingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
