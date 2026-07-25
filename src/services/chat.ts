import type { ChatMessage } from '@/types/models';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/lib/logger';
import { sendNotificationToFamily } from '../lib/onesignal';

const MESSAGES_LIMIT = 100;

const buildMessagesQuery = (familyId: string) =>
  query(
    collection(db, 'families', familyId, 'chat'),
    orderBy('created_at', 'desc'),
    limit(MESSAGES_LIMIT),
  );

export const subscribeToMessages = (
  familyId: string,
  callback: (messages: ChatMessage[]) => void,
) => {
  let active = true;
  let unsubscribe: (() => void) | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;

  const cleanup = () => {
    active = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    unsubscribe?.();
  };

  const subscribe = () => {
    if (!active) return;

    unsubscribe = onSnapshot(
      buildMessagesQuery(familyId),
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text,
            senderId: data.sender_id,
            senderName: data.sender_name,
            createdAt: data.created_at,
          };
        });
        callback(messages.reverse());
      },
      (error: any) => {
        if (error?.code === 'permission-denied' && attempts < 2) {
          attempts += 1;
          logger.warn(`Chat permission denied, retrying subscription (${attempts}/2)...`);
          unsubscribe?.();
          retryTimer = setTimeout(() => {
            subscribe();
          }, 1000);
          return;
        }

        logger.error('Chat snapshot error:', error);
      },
    );
  };

  subscribe();
  return cleanup;
};

export const sendMessage = async ({
  familyId,
  text,
  senderId,
  senderName,
}: {
  familyId: string;
  text: string;
  senderId: string;
  senderName: string;
}) => {
  await addDoc(collection(db, 'families', familyId, 'chat'), {
    text,
    sender_id: senderId,
    sender_name: senderName,
    created_at: Timestamp.now(),
  });

  try {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: senderId,
      title: senderName,
      body: text.length > 80 ? text.substring(0, 80) + '...' : text,
      data: { type: 'chat_message' },
    });
  } catch (error) {
    logger.error('Erro ao enviar notificação (chat):', error);
  }
};
