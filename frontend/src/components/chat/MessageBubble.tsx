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
        justifyContent: isSelf ? 'flex-end' : 'flex-start',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: '8px 12px 6px 12px',
          borderRadius: isSelf
            ? 'var(--radius-md) var(--radius-md) 2px var(--radius-md)'
            : 'var(--radius-md) var(--radius-md) var(--radius-md) 2px',
          background: isSelf ? '#1a5fb4' : 'var(--bg-elevated)',
          border: `1px solid ${isSelf ? '#1a5fb4' : 'var(--border)'}`,
          color: isSelf ? '#ffffff' : 'var(--text-primary)',
          fontSize: 13.5,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Message text */}
        <span>{message.text}</span>

        {/* Timestamp — bottom right inside the bubble */}
        <span
          style={{
            display: 'block',
            textAlign: 'right',
            fontSize: 10,
            color: isSelf ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginTop: 4,
            opacity: 0.7,
          }}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};