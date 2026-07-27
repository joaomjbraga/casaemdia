import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/Colors';
import type { ChatMessage } from '@/types/models';
import AudioPlayer from './AudioPlayer';
import ImageViewer from './ImageViewer';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  avatarUri?: string | null;
  onDelete?: (messageId: string) => void;
}

function formatTime(timestamp: any): string {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn, avatarUri, onDelete }: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const statusLabel =
    message.status === 'sending'
      ? 'Enviando...'
      : message.status === 'error'
        ? 'Erro ao enviar'
        : null;

  const openImageViewer = useCallback((url: string) => {
    setViewerUri(url);
  }, []);
  const closeImageViewer = useCallback(() => {
    setViewerUri(null);
  }, []);

  const handleDelete = useCallback(() => {
    onDelete?.(message.id);
  }, [message.id, onDelete]);

  const senderLine = isOwn ? 'Você' : message.senderName || 'Usuário';

  const fallbackInitial = (message.senderName || 'U')[0].toUpperCase();

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <View style={styles.senderHeader}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.senderAvatar} contentFit="cover" />
          ) : (
            <View style={styles.senderAvatarFallback}>
              <Text style={styles.senderAvatarFallbackText}>{fallbackInitial}</Text>
            </View>
          )}
          <Text style={styles.senderName}>{senderLine}</Text>
        </View>
        {message.attachment?.type === 'image' && message.attachment.url ? (
          imageError ? (
            <View style={[styles.attachmentImage, styles.attachmentImagePlaceholder]}>
              <Text style={styles.attachmentPlaceholderText}>Imagem indisponível</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openImageViewer(message.attachment!.url!)}
            >
              <Image
                source={{ uri: message.attachment.url }}
                style={styles.attachmentImage}
                contentFit="cover"
                onError={() => setImageError(true)}
              />
            </TouchableOpacity>
          )
        ) : null}
        {message.attachment?.type === 'audio' && message.attachment.url ? (
          <View style={styles.attachmentAudioContainer}>
            <AudioPlayer uri={message.attachment.url} name={message.attachment.name} />
          </View>
        ) : null}
        {message.text ? (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.text}</Text>
        ) : null}
        <View style={styles.footerRow}>
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && onDelete ? (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
              <Text style={[styles.deleteText, isOwn && styles.deleteTextOwn]}>Excluir</Text>
            </TouchableOpacity>
          ) : null}
          {statusLabel ? (
            <Text style={[styles.statusText, isOwn && styles.statusTextOwn]}>{statusLabel}</Text>
          ) : null}
        </View>
      </View>

      <ImageViewer visible={!!viewerUri} uri={viewerUri ?? ''} onClose={closeImageViewer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    flexShrink: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderBottomLeftRadius: 4,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  senderAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  senderAvatarFallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  attachmentImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.inputBackground,
  },
  attachmentImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.mutedText,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  attachmentAudioContainer: {
    marginBottom: 8,
    backgroundColor: `${Colors.light.primary}16`,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.light.text,
    lineHeight: 20,
    flexShrink: 1,
  },
  messageTextOwn: {
    color: Colors.light.textWhite,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  time: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.mutedText,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  deleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  deleteTextOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  statusTextOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
});
