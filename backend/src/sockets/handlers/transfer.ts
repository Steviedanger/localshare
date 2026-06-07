// Transfer notification handler
// The actual file bytes travel via HTTP (POST /api/files/upload).
// These socket events handle the signaling: "a file is coming your way"

import { Server, Socket } from 'socket.io';
import { prisma } from '../../db/prisma';
import { deviceMap } from './presence';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Notify the recipient that a file is incoming */
export async function handleTransferNotify(
  io: IO,
  socket: AppSocket,
  payload: {
    transferId: string;
    toId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  },
): Promise<void> {
  const { userId, username } = socket.data;
  if (!userId) return;

  const { transferId, toId, filename, mimeType, sizeBytes } = payload;

  const recipientDevice = Array.from(deviceMap.values()).find((d) => d.id === toId);
  if (!recipientDevice) {
    socket.emit('error', 'Recipient is offline');
    return;
  }

  // Pre-create transfer record so the upload route can find it
  await prisma.transfer.create({
    data: {
      id: transferId,
      filename,
      mimeType,
      sizeBytes: BigInt(sizeBytes),
      storagePath: '', // filled in by upload route
      status: 'PENDING',
      senderId: userId,
      receiverId: toId,
    },
  }).catch(() => {}); // May already exist if client retried

  // Notify recipient
  socket.to(recipientDevice.socketId).emit('transfer:incoming', {
    id: transferId,
    filename,
    mimeType,
    sizeBytes,
    senderId: userId,
    senderUsername: username,
    receiverId: toId,
  });

  console.log(`📦 Transfer ${transferId}: ${filename} (${sizeBytes} bytes) → ${recipientDevice.username}`);
}

/** Called by the upload route after successful storage to notify both parties */
export function notifyTransferComplete(
  io: IO,
  transferId: string,
  downloadUrl: string,
  filename: string,
  senderId: string,
  receiverId: string,
): void {
  const senderDevice = Array.from(deviceMap.values()).find((d) => d.id === senderId);
  const recipientDevice = Array.from(deviceMap.values()).find((d) => d.id === receiverId);

  const payload = { transferId, downloadUrl, filename };

  if (senderDevice) {
    io.to(senderDevice.socketId).emit('transfer:complete', payload);
  }
  if (recipientDevice) {
    io.to(recipientDevice.socketId).emit('transfer:complete', payload);
  }
}
