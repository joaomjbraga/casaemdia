import type { ChatMessage } from '@/types/models';
import { api } from './api';
import { connectSocket } from './socket';

export const subscribeToChatApi = async (familyId: string, callback: any) => {
  const socket = await connectSocket('');

  socket.on('connect', () => {
    socket.emit('family:join', { familyId });
  });

  const fetchMessages = async () => {
    try {
      const data = await api.chat.list(familyId);
      if (data?.messages) {
        callback(data.messages);
      }
    } catch (error) {
      console.error('fetchChat error:', error);
    }
  };

  fetchMessages();

  socket.on('chat:created', ({ message }: { message: ChatMessage }) => {
    callback((prev: ChatMessage[]) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  });

  socket.on('chat:deleted', ({ messageId }: { messageId: string }) => {
    callback((prev: ChatMessage[]) => prev.filter((m: ChatMessage) => m.id !== messageId));
  });

  socket.on('chat:cleared', () => {
    callback([]);
  });

  return () => {
    socket.off('chat:created');
    socket.off('chat:deleted');
    socket.off('chat:cleared');
    socket.emit('family:leave', { familyId });
  };
};

export const sendMessageApi = async (familyId: string, text: string, attachment?: any) => {
  const data = await api.chat.create(familyId, { text, attachment });
  return data.message;
};

export const deleteMessageApi = async (familyId: string, messageId: string) => {
  await api.chat.delete(familyId, messageId);
};

export const clearChatApi = async (familyId: string) => {
  const data = await api.chat.clear(familyId);
  return data;
};
