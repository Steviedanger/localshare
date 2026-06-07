// Message handler: relay text messages between devices
// Messages are NOT persisted — they live in client memory only

import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { deviceMap } from './presence';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleMessage(
  socket: AppSocket,
  payload: { toId: string; text: string },
): void {
  const { userId, username } = socket.data;
  if (!userId) return;

  const { toId, text } = payload;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 4000) return;

  // Find the recipient socket by their userId in the device map
  const recipientDevice = Array.from(deviceMap.values()).find((d) => d.id === toId);
  if (!recipientDevice) {
    socket.emit('error', 'Recipient is offline');
    return;
  }

  const message = {
    id: uuidv4(),
    fromId: userId,
    fromUsername: username,
    toId,
    text: trimmed,
    timestamp: new Date().toISOString(),
  };

  // Deliver to recipient
  socket.to(recipientDevice.socketId).emit('message:receive', message);

  // Echo back to sender so their UI can confirm delivery
  socket.emit('message:receive', message);
}
