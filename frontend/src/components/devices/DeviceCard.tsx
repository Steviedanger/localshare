import React from 'react';
import { Avatar } from '../common/Avatar';
import type { Device } from '../../types';

interface Props {
  device: Device;
  isSelected: boolean;
  isSelf: boolean;
  unreadCount: number;
  onClick: () => void;
}

export const DeviceCard: React.FC<Props> = ({
  device, isSelected, isSelf, unreadCount, onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: isSelected ? 'var(--bg-active)' : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${isSelected ? 'var(--accent-blue)' : 'transparent'}`,
        cursor: isSelf ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        textAlign: 'left',
        transition: 'background var(--transition)',
        animation: 'slideIn 0.2s ease',
        opacity: isSelf ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isSelf)
          (e.currentTarget.style.background = 'var(--bg-hover)');
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget.style.background = 'transparent');
      }}
    >
      <Avatar username={device.username} size={34} online={true} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {device.username}
          </span>
          {isSelf && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              you
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          online
        </div>
      </div>
      {unreadCount > 0 && !isSelected && (
        <span
          style={{
            background: 'var(--accent-blue)',
            color: '#fff',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            padding: '1px 7px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
};
