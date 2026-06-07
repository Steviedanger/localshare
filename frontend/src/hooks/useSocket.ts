/**
 * hooks/useSocket.ts
 * Connects the socket on mount, sends user:join, and wires all incoming events
 * to the appropriate Zustand stores.
 */
import { useEffect } from 'react';
import { socket } from '../socket';
import { useDeviceStore } from '../store/useDeviceStore';
import { useMessageStore } from '../store/useMessageStore';
import { useTransferStore } from '../store/useTransferStore';

const USER_ID_KEY = 'localshare:userId';
const USERNAME_KEY = 'localshare:username';

export function useSocket() {
  const { setDevices, setSelf, updateUsername } = useDeviceStore();
  const { addMessage } = useMessageStore();
  const { addTransfer, updateProgress, completeTransfer, failTransfer } = useTransferStore();

  useEffect(() => {
    // ── Register event listeners ────────────────────────────────────────────

    socket.on('user:welcome', ({ userId, username }) => {
      // Persist identity across page refreshes
      localStorage.setItem(USER_ID_KEY, userId);
      localStorage.setItem(USERNAME_KEY, username);
      setSelf({ userId, username });
    });

    socket.on('device:list', setDevices);

    socket.on('user:renamed', ({ userId, username }) => {
      updateUsername(userId, username);
    });

    socket.on('message:receive', (message) => {
      // Store under the peer's ID (works for both sent and received)
      const self = useDeviceStore.getState().self;
      const peerId = message.fromId === self?.userId ? message.toId : message.fromId;
      addMessage(peerId, message);
    });

    socket.on('transfer:incoming', (meta) => {
      const self = useDeviceStore.getState().self;
      addTransfer({
        id: meta.id,
        filename: meta.filename,
        mimeType: meta.mimeType,
        sizeBytes: meta.sizeBytes,
        status: 'pending',
        progress: 0,
        direction: 'received',
        peerId: meta.senderId,
        peerUsername: meta.senderUsername,
        timestamp: new Date().toISOString(),
      });
      // Suppress unused variable warning
      void self;
    });

    socket.on('transfer:progress', ({ transferId, percent }) => {
      updateProgress(transferId, percent);
    });

    socket.on('transfer:complete', ({ transferId, downloadUrl }) => {
      completeTransfer(transferId, downloadUrl);
    });

    socket.on('transfer:error', ({ transferId }) => {
      failTransfer(transferId);
    });

    // ── Connect ─────────────────────────────────────────────────────────────

    socket.connect();

    socket.on('connect', () => {
      const storedUserId = localStorage.getItem(USER_ID_KEY) ?? undefined;
      const storedUsername = localStorage.getItem(USERNAME_KEY) ?? `Device-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      socket.emit('user:join', {
        userId: storedUserId,
        username: storedUsername,
      });
    });

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      socket.off('user:welcome');
      socket.off('device:list');
      socket.off('user:renamed');
      socket.off('message:receive');
      socket.off('transfer:incoming');
      socket.off('transfer:progress');
      socket.off('transfer:complete');
      socket.off('transfer:error');
      socket.off('connect');
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
