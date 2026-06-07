// Zustand store: chat messages, keyed by the OTHER party's userId
// e.g. messages['abc-123'] = all messages in the conversation with device abc-123

import { create } from 'zustand';
import { Message } from '../types';

interface MessageState {
  // conversationId = the other party's userId
  conversations: Record<string, Message[]>;
  unreadCounts: Record<string, number>;

  addMessage: (conversationId: string, message: Message) => void;
  markRead: (conversationId: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: {},
  unreadCounts: {},

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: [...(state.conversations[conversationId] ?? []), message],
      },
    })),

  markRead: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),
}));
