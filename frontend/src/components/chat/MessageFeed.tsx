import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TransferItem } from '../transfer/TransferItem';
import { useMessageStore } from '../../store/useMessageStore';
import { useTransferStore } from '../../store/useTransferStore';
import { useDeviceStore } from '../../store/useDeviceStore';

interface Props {
  peerId: string;
}

export const MessageFeed: React.FC<Props> = ({ peerId }) => {
  const messages = useMessageStore((s) => s.getMessages(peerId));
  const transfers = useTransferStore((s) => s.transfers.filter((t) => t.peerId === peerId));
  const selfId = useDeviceStore((s) => s.self?.userId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Merge messages and transfers into one chronological list
  const feed = [
    ...messages.map((m) => ({ type: 'message' as const, timestamp: m.timestamp, data: m })),
    ...transfers.map((t) => ({ type: 'transfer' as const, timestamp: t.timestamp, data: t })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Auto-scroll to bottom on new items
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  if (feed.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.3 }}>💬</div>
        <div>No messages yet. Say hello!</div>
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
      {feed.map((item) => {
        if (item.type === 'message') {
          return (
            <MessageBubble
              key={item.data.id}
              message={item.data}
              isSelf={item.data.fromId === selfId}
            />
          );
        }
        return (
          <div
            key={item.data.id}
            style={{
              alignSelf: item.data.direction === 'sent' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              minWidth: 260,
            }}
          >
            <TransferItem transfer={item.data} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};