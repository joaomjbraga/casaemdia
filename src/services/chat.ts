import type { ChatAttachment, ChatMessage } from '@/types/models';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
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
          const attachment = data.attachment
            ? {
                url: data.attachment.url,
                type: data.attachment.type,
                name: data.attachment.name,
                mimeType: data.attachment.mimeType,
                publicId: data.attachment.publicId,
              }
            : undefined;

          return {
            id: doc.id,
            text: data.text,
            senderId: data.sender_id,
            senderName: data.sender_name,
            createdAt: data.created_at,
            attachment,
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
  attachment,
}: {
  familyId: string;
  text: string;
  senderId: string;
  senderName: string;
  attachment?: ChatAttachment;
}) => {
  await addDoc(collection(db, 'families', familyId, 'chat'), {
    text,
    sender_id: senderId,
    sender_name: senderName,
    created_at: Timestamp.now(),
    attachment: attachment
      ? {
          url: attachment.url,
          type: attachment.type,
          name: attachment.name,
          mimeType: attachment.mimeType,
          publicId: attachment.publicId,
        }
      : null,
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

export const deleteChatMessage = async (familyId: string, messageId: string) => {
  await deleteDoc(doc(db, 'families', familyId, 'chat', messageId));
};

export const clearChatMessages = async (familyId: string) => {
  const snapshot = await getDoc(doc(db, 'families', familyId));
  const today = new Date().toDateString();
  const lastClearedAt = snapshot.data()?.chatClearedAt?.toDate?.()?.toDateString();

  if (lastClearedAt === today) {
    return { cleared: false, reason: 'already_cleared_today', publicIds: [] };
  }

  const messagesRef = collection(db, 'families', familyId, 'chat');
  const messagesSnapshot = await getDocs(messagesRef);

  const batch = writeBatch(db);
  const publicIds: string[] = [];

  messagesSnapshot.docs.forEach((messageDoc) => {
    const data = messageDoc.data();
    const attachment = data.attachment as ChatAttachment | undefined;
    const publicId = attachment?.publicId;
    if (publicId) {
      publicIds.push(publicId);
    }
    batch.delete(messageDoc.ref);
  });

  if (messagesSnapshot.size > 0) {
    await batch.commit();
  }

  await updateDoc(doc(db, 'families', familyId), {
    chatClearedAt: Timestamp.now(),
  });

  return { cleared: true, count: messagesSnapshot.size, publicIds };
};
