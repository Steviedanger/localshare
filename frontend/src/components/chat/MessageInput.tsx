import React, { useState } from 'react';
import { socket } from '../../socket';
import { useDeviceStore } from '../../store/useDeviceStore';

interface Props {
  toId: string;
}

export const MessageInput: React.FC<Props> = ({ toId }) => {
  const [text, setText] = useState('');
  const self = useDeviceStore((s) => s.self);

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !self) return;
    socket.emit('message:send', { toId, text: trimmed });
    setText('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message… (Enter to send)"
        rows={1}
        style={{
          flex: 1,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13.5,
          padding: '9px 12px',
          outline: 'none',
          resize: 'none',
          lineHeight: 1.5,
          transition: 'border-color var(--transition)',
          maxHeight: 120,
          overflowY: 'auto',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        style={{
          background: text.trim() ? 'var(--accent-blue)' : 'var(--bg-active)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          color: text.trim() ? '#fff' : 'var(--text-muted)',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          padding: '9px 16px',
          transition: 'background var(--transition)',
          height: 38,
        }}
      >
        Send ↵
      </button>
    </div>
  );
};