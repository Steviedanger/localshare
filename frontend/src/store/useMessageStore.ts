import { create } from 'zustand';
import { Message } from '../types';

interface MessageState {
  conversations: Record<string, Message[]>;
  unreadCounts: Record<string, number>;

  addMessage: (conversationId: string, message: Message) => void;
  markRead: (conversationId: string) => void;
  getMessages: (conversationId: string) => Message[];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: {},
  unreadCounts: {},

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: [
          ...(state.conversations[conversationId] ?? []),
          message,
        ],
      },
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1,
      },
    })),

  markRead: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  getMessages: (conversationId) =>
    get().conversations[conversationId] ?? [],
}));