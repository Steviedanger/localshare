import React from 'react';
import { ProgressBar } from '../common/ProgressBar';
import type { Transfer } from '../../types';

interface Props {
  transfer: Transfer;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

const STATUS_ICON: Record<Transfer['status'], string> = {
  pending:   '⏳',
  uploading: '📤',
  completed: '✅',
  failed:    '❌',
};

export const TransferItem: React.FC<Props> = ({ transfer }) => {
  const icon = transfer.direction === 'received' ? '📥' : STATUS_ICON[transfer.status];

  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {transfer.filename}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {formatBytes(transfer.sizeBytes)} · {transfer.direction === 'sent' ? `→ ${transfer.peerUsername}` : `← ${transfer.peerUsername}`}
          </div>
        </div>

        {/* Download button for received completed transfers */}
        {transfer.status === 'completed' && transfer.downloadUrl && (
          <a
            href={transfer.downloadUrl}
            download={transfer.filename}
            style={{
              background: 'var(--accent-green)22',
              border: '1px solid var(--accent-green)55',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            ↓ Save
          </a>
        )}

        {transfer.status === 'failed' && (
          <span style={{ fontSize: 11, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
            failed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {(transfer.status === 'uploading' || transfer.status === 'pending') && (
        <ProgressBar value={transfer.progress} status={transfer.status} />
      )}
      {transfer.status === 'completed' && (
        <ProgressBar value={100} status="completed" />
      )}
    </div>
  );
};
