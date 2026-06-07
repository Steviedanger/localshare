import React from 'react';
import { DeviceList } from '../devices/DeviceList';
import { UsernameEditor } from '../common/UsernameEditor';
import { Avatar } from '../common/Avatar';
import { useLocalUser } from '../../hooks/useLocalUser';

export const Sidebar: React.FC = () => {
  const { self } = useLocalUser();

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'var(--accent-blue)22',
            border: '1px solid var(--accent-blue)44',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          📡
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
            LocalShare
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            local network
          </div>
        </div>
      </div>

      {/* Device list */}
      <DeviceList />

      {/* Footer — self identity */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {self && <Avatar username={self.username} size={28} />}
        <UsernameEditor />
      </div>
    </aside>
  );
};
