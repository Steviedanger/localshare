import React from 'react';
import { MessageFeed } from '../chat/MessageFeed';
import { MessageInput } from '../chat/MessageInput';
import { DropZone } from '../transfer/DropZone';
import { TransferPanel } from '../transfer/TransferPanel';
import { Avatar } from '../common/Avatar';
import { useDeviceStore } from '../../store/useDeviceStore';

export const ChatArea: React.FC = () => {
  const { devices, selectedDeviceId } = useDeviceStore();
  const peer = devices.find((d) => d.id === selectedDeviceId);

  // Nothing selected
  if (!peer) {
    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-base)',
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.3 }}>📡</div>
        <div style={{ fontSize: 13 }}>Select a device to start chatting</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Files and messages stay on your network</div>
      </main>
    );
  }

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Peer header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <Avatar username={peer.username} size={32} online />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
            {peer.username}
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
            ● online
          </div>
        </div>
      </div>

      {/* Message feed */}
      <MessageFeed peerId={peer.id} />

      {/* Transfer panel — shown when transfers exist */}
      <TransferPanel peerId={peer.id} />

      {/* File drop zone */}
      <DropZone toId={peer.id} toUsername={peer.username} />

      {/* Message input */}
      <MessageInput toId={peer.id} />
    </main>
  );
};
