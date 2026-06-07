/**
 * hooks/useFileUpload.ts
 * Handles the full send-file flow:
 * 1. Emit transfer:start over socket (alerts recipient)
 * 2. POST file to /api/upload with axios progress tracking
 * 3. Update transfer store on progress and completion
 */
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

    // Announce the transfer to the recipient via socket
    socket.emit('transfer:start', {
      transferId,
      toId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });

    // Add to our own transfer list immediately
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transferId', transferId);
      formData.append('senderId', self.userId);
      formData.append('receiverId', toId);

      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updateProgress(transferId, percent);
          }
        },
      });
      // transfer:complete is emitted by the server via socket — store update happens there
    } catch (err) {
      failTransfer(transferId);
      throw err;
    }
  }

  return { sendFile };
}
