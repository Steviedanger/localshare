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
    // user:welcome — server confirms our identity after join
    socket.on('user:welcome', ({ userId, username }) => {
      localStorage.setItem(USER_ID_KEY, userId);
      localStorage.setItem(USERNAME_KEY, username);
      setSelf({ userId, username });
    });

    // device:list — full refreshed list of online devices
    socket.on('device:list', (devices) => {
      setDevices(devices);
    });

    // user:renamed — someone changed their name
    socket.on('user:renamed', ({ userId, username }) => {
      updateUsername(userId, username);
    });

    // message:receive — a message arrived
    socket.on('message:receive', (message) => {
      const self = useDeviceStore.getState().self;
      const peerId =
        message.fromId === self?.userId ? message.toId : message.fromId;
      addMessage(peerId, message);
    });

    // transfer:incoming — someone is sending us a file
    socket.on('transfer:incoming', (meta) => {
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
    });

    socket.on('transfer:progress', ({ transferId, percent }) => {
      updateProgress(transferId, percent);
    });

    socket.on('transfer:complete', ({ transferId, downloadUrl }) => {
      completeTransfer(transferId, downloadUrl);
    });

    socket.on('transfer:failed', ({ transferId }) => {
      failTransfer(transferId);
    });

    // Connect and announce ourselves
    socket.connect();

    socket.on('connect', () => {
      const storedUserId = localStorage.getItem(USER_ID_KEY) ?? undefined;
      const storedUsername =
        localStorage.getItem(USERNAME_KEY) ??
        `Device-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      socket.emit('user:join', {
        userId: storedUserId,
        username: storedUsername,
      });
    });

    return () => {
      socket.off('user:welcome');
      socket.off('device:list');
      socket.off('user:renamed');
      socket.off('message:receive');
      socket.off('transfer:incoming');
      socket.off('transfer:progress');
      socket.off('transfer:complete');
      socket.off('transfer:failed');
      socket.off('connect');
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}