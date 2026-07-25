import Colors from '@/constants/Colors';
import type { ChatMessage } from '@/types/models';
import { StyleSheet, Text, View } from 'react-native';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatTime(timestamp: any): string {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const statusLabel =
    message.status === 'sending'
      ? 'Enviando...'
      : message.status === 'error'
        ? 'Erro ao enviar'
        : null;

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.senderName}>{message.senderName}</Text>}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.text}</Text>
        <View style={styles.footerRow}>
          <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatTime(message.createdAt)}</Text>
          {statusLabel ? (
            <Text style={[styles.statusText, isOwn && styles.statusTextOwn]}>{statusLabel}</Text>
          ) : null}
        </View>
      </View>
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
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 2,
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
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  statusTextOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
});
