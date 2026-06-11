import React, { useState, useRef, useCallback } from 'react';
import { socket } from '../../socket';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useFileUpload } from '../../hooks/useFileUpload';

interface Props {
  toId: string;
  toUsername: string;
}

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😮','😢','😡','🥳',
  '👍','👎','👏','🙌','🤝','🙏','❤️','🔥','✅','⚡',
  '😅','🤣','😊','😇','🤩','😏','😒','😔','😤','🤯',
  '👀','💪','🎉','🎊','💯','🚀','💡','📁','📎','🖇️',
];

export const MessageInput: React.FC<Props> = ({ toId, toUsername }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const self = useDeviceStore((s) => s.self);
  const { sendFile } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !self) return;
    socket.emit('message:send', { toId, text: trimmed });
    setText('');
    setShowEmojis(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape') setShowEmojis(false);
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // Restore cursor after emoji
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        await sendFile(file, toId, toUsername).catch(console.error);
      }
    },
    [sendFile, toId, toUsername]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        borderTop: `1px solid ${isDragging ? 'var(--accent-blue)' : 'var(--border)'}`,
        background: isDragging ? 'var(--accent-blue)08' : 'transparent',
        transition: 'border-color var(--transition), background var(--transition)',
        flexShrink: 0,
      }}
    >
      {/* Drag overlay hint */}
      {isDragging && (
        <div style={{
          padding: '8px 16px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-blue)',
          textAlign: 'center',
        }}>
          📂 Drop to send to {toUsername}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojis && (
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          background: 'var(--bg-surface)',
          maxHeight: 120,
          overflowY: 'auto',
        }}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                padding: '2px 4px',
                borderRadius: 4,
                lineHeight: 1,
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* + file button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Send a file"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background var(--transition)',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
        >
          +
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13.5,
            padding: '8px 12px',
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

        {/* Emoji button */}
        <button
          onClick={() => setShowEmojis((v) => !v)}
          title="Emoji"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            background: showEmojis ? 'var(--bg-active)' : 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = showEmojis ? 'var(--bg-active)' : 'var(--bg-elevated)')}
        >
          😊
        </button>

        {/* Send button */}
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            height: 36,
            flexShrink: 0,
            background: text.trim() ? 'var(--accent-blue)' : 'var(--bg-active)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: text.trim() ? '#fff' : 'var(--text-muted)',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            padding: '0 16px',
            transition: 'background var(--transition)',
          }}
        >
          Send ↵
        </button>
      </div>
    </div>
  );
};