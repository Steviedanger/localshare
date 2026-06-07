import React from 'react';
import { TransferItem } from './TransferItem';
import { useTransferStore } from '../../store/useTransferStore';

interface Props {
  peerId: string;
}

export const TransferPanel: React.FC<Props> = ({ peerId }) => {
  const transfers = useTransferStore((s) =>
    s.transfers.filter((t) => t.peerId === peerId)
  );

  if (transfers.length === 0) return null;

  return (
    <div style={{ padding: '0 16px 8px' }}>
      <div
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Transfers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {transfers.map((t) => (
          <TransferItem key={t.id} transfer={t} />
        ))}
      </div>
    </div>
  );
};
