import React from 'react';
import { DeviceCard } from './DeviceCard';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useMessageStore } from '../../store/useMessageStore';

export const DeviceList: React.FC = () => {
    console.log('DeviceList rendering');

  const { devices, self, selectedDeviceId, setSelectedDevice } = useDeviceStore();
  const { unreadCounts, markRead } = useMessageStore();

  const peers = devices.filter((d) => d.id !== self?.userId);
  const me = devices.find((d) => d.id === self?.userId);

  function select(id: string) {
    setSelectedDevice(id);
    markRead(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      {/* Section: peers */}
      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Devices ({peers.length})
      </div>

      {peers.length === 0 ? (
        <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ animation: 'pulse 2s ease infinite', display: 'inline-block' }}>●</span>
          {' '}Waiting for devices…
        </div>
      ) : (
        peers.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            isSelected={selectedDeviceId === device.id}
            isSelf={false}
            unreadCount={unreadCounts[device.id] ?? 0}
            onClick={() => select(device.id)}
          />
        ))
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {/* Section: self */}
      <div style={{ padding: '0 14px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        This Device
      </div>
      {me && (
        <DeviceCard
          device={me}
          isSelected={false}
          isSelf={true}
          unreadCount={0}
          onClick={() => {}}
        />
      )}
    </div>
  );
};
