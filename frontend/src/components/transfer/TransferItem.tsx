import React, { useState } from 'react';
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
  pending: '⏳',
  uploading: '📤',
  completed: '✅',
  failed: '❌',
};

function isImage(mimeType: string) { return mimeType.startsWith('image/'); }
function isVideo(mimeType: string) { return mimeType.startsWith('video/'); }
function isPDF(mimeType: string) { return mimeType === 'application/pdf'; }
function canPreview(mimeType: string) {
  return isImage(mimeType) || isVideo(mimeType) || isPDF(mimeType);
}

export const TransferItem: React.FC<Props> = ({ transfer }) => {
  const [expanded, setExpanded] = useState(true);

  const icon =
    transfer.direction === 'received' ? '📥' : STATUS_ICON[transfer.status];

  const showPreview =
    transfer.status === 'completed' &&
    !!transfer.downloadUrl &&
    canPreview(transfer.mimeType);

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
        }}
      >
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
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatBytes(transfer.sizeBytes)}
            {' · '}
            {transfer.direction === 'sent'
              ? `→ ${transfer.peerUsername}`
              : `← ${transfer.peerUsername}`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {showPreview && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: 'var(--bg-active)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              {expanded ? '▲ Hide' : '▼ View'}
            </button>
          )}

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
              }}
            >
              ↓ Save
            </a>
          )}

          {transfer.status === 'failed' && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--accent-red)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              failed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(transfer.status === 'uploading' || transfer.status === 'pending') && (
        <div style={{ padding: '0 12px 10px' }}>
          <ProgressBar value={transfer.progress} status={transfer.status} />
        </div>
      )}

      {/* Inline preview */}
      {showPreview && expanded && transfer.downloadUrl && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: 400,
            overflow: 'hidden',
          }}
        >
          {isImage(transfer.mimeType) && (
            <img
              src={transfer.downloadUrl}
              alt={transfer.filename}
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
          {isVideo(transfer.mimeType) && (
            <video
              src={transfer.downloadUrl}
              controls
              style={{ maxWidth: '100%', maxHeight: 400, display: 'block' }}
            />
          )}
          {isPDF(transfer.mimeType) && (
            <iframe
              src={transfer.downloadUrl}
              title={transfer.filename}
              style={{ width: '100%', height: 400, border: 'none' }}
            />
          )}
        </div>
      )}
    </div>
  );
};
