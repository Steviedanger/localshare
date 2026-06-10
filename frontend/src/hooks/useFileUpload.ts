import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';
import { api } from '../api';
import { useTransferStore } from '../store/useTransferStore';
import { useDeviceStore } from '../store/useDeviceStore';

export function useFileUpload() {
  const { addTransfer, updateProgress, failTransfer } = useTransferStore();
  const self = useDeviceStore((s) => s.self);

  async function sendFile(file: File, toId: string, toUsername: string) {
    if (!self) throw new Error('Not connected');

    const transferId = uuidv4();

    // 1. Notify recipient via socket that a file is coming
    socket.emit('transfer:notify', {
      transferId,
      toId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });

    // 2. Add to our own transfer list immediately
    addTransfer({
      id: transferId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      status: 'uploading',
      progress: 0,
      direction: 'sent',
      peerId: toId,
      peerUsername: toUsername,
      timestamp: new Date().toISOString(),
    });

    try {
      // 3. POST the file via HTTP with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transferId', transferId);
      formData.append('senderId', self.userId);
      formData.append('receiverId', toId);

      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updateProgress(transferId, percent);
          }
        },
      });
      // transfer:complete arrives via socket from the server
    } catch (err) {
      failTransfer(transferId);
      throw err;
    }
  }

  return { sendFile };
}