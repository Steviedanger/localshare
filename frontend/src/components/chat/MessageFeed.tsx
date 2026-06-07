import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { useMessageStore } from '../../store/useMessageStore';
import { useDeviceStore } from '../../store/useDeviceStore';

interface Props {
  peerId: string;
}

export const MessageFeed: React.FC<Props> = ({ peerId }) => {
  const messages = useMessageStore((s) => s.getMessages(peerId));
  const selfId = useDeviceStore((s) => s.self?.userId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} isSelf={m.fromId === selfId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
