import React, { useCallback, useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface Props {
  toId: string;
  toUsername: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export const DropZone: React.FC<Props> = ({ toId, toUsername }) => {
  const { sendFile } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      for (const file of Array.from(files)) {
        setSending(file.name);
        try {
          await sendFile(file, toId, toUsername);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
      setSending(null);
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

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 24,
          border: `1.5px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          background: isDragging ? 'var(--accent-blue)08' : 'var(--bg-elevated)',
          cursor: 'pointer',
          transition: 'border-color var(--transition), background var(--transition)',
          minHeight: 100,
        }}
      >
        <input
          type="file"
          multiple
          onChange={onInputChange}
          style={{ display: 'none' }}
        />

        {sending ? (
          <>
            <span style={{ fontSize: 20 }}>📤</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue)' }}>
              Sending {sending}…
            </span>
          </>
        ) : isDragging ? (
          <>
            <span style={{ fontSize: 22 }}>📂</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue)' }}>
              Drop to send
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 20, opacity: 0.5 }}>📁</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              Drop files here or click to browse
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
              Sends directly to {toUsername}
            </span>
          </>
        )}
      </label>

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
};
