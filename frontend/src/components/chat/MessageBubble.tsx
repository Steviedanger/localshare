import React from 'react';
import type { Message } from '../../types';

interface Props {
  message: Message;
  isSelf: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageBubble: React.FC<Props> = ({ message, isSelf }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        animation: 'fadeIn 0.15s ease',
        gap: 3,
      }}
    >
      {/* Sender label */}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingInline: 4 }}>
        {isSelf ? 'you' : message.fromUsername} · {formatTime(message.timestamp)}
      </span>

      {/* Bubble */}
      <div
        style={{
          maxWidth: 480,
          padding: '8px 12px',
          borderRadius: isSelf
            ? 'var(--radius-md) var(--radius-md) 2px var(--radius-md)'
            : 'var(--radius-md) var(--radius-md) var(--radius-md) 2px',
          background: isSelf ? 'var(--accent-blue)22' : 'var(--bg-elevated)',
          border: `1px solid ${isSelf ? 'var(--accent-blue)44' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          fontSize: 13.5,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {message.text}
      </div>
    </div>
  );
};
