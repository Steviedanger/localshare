import React, { useState } from 'react';
import { useLocalUser } from '../../hooks/useLocalUser';

export const UsernameEditor: React.FC = () => {
  const { self, rename } = useLocalUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(self?.username ?? '');
    setEditing(true);
  }

  async function submit() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await rename(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={30}
          disabled={saving}
          style={{
            background: 'var(--bg-active)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '3px 8px',
            outline: 'none',
            width: 140,
          }}
        />
        <button onClick={submit} disabled={saving} style={btnStyle('#3d8ef0')}>
          {saving ? '...' : '✓'}
        </button>
        <button onClick={() => setEditing(false)} style={btnStyle('#4a5168')}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Click to rename"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 4px',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 600,
        transition: 'background var(--transition)',
      }}
      onMouseEnter={(e) => ((e.currentTarget.style.background = 'var(--bg-hover)'))}
      onMouseLeave={(e) => ((e.currentTarget.style.background = 'none'))}
    >
      {self?.username ?? '…'}
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>✏</span>
    </button>
  );
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    padding: '3px 8px',
    fontFamily: 'var(--font-mono)',
  };
}
