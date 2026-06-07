// Socket.IO server setup — registers all event handlers

import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types';
import { handleJoin, handleDisconnect, handleRename } from './handlers/presence';
import { handleMessage } from './handlers/message';
import { handleTransferNotify } from './handlers/transfer';

export type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: AppIO): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Phase 1: Join — identify the device
    socket.on('user:join', (payload) => handleJoin(io, socket, payload));

    // Phase 2: Rename
    socket.on('user:rename', (payload) => handleRename(io, socket, payload));

    // Phase 3: Messaging
    socket.on('message:send', (payload) => handleMessage(socket, payload));

    // Phase 4: File transfer signaling
    socket.on('transfer:notify', (payload) => handleTransferNotify(io, socket, payload));

    // Cleanup on disconnect
    socket.on('disconnect', () => handleDisconnect(io, socket));
  });
}
