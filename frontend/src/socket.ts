import { io, Socket } from 'socket.io-client';
import type { Device, Message, TransferMeta } from './types';

interface ServerToClientEvents {
  'device:list': (devices: Device[]) => void;
  'user:welcome': (data: { userId: string; username: string }) => void;
  'user:renamed': (data: { userId: string; username: string }) => void;
  'message:receive': (message: Message) => void;
  'transfer:incoming': (meta: TransferMeta) => void;
  'transfer:progress': (data: {
    transferId: string;
    percent: number;
    bytesUploaded: number;
  }) => void;
  'transfer:complete': (data: {
    transferId: string;
    filename: string;
    downloadUrl: string;
  }) => void;
  'transfer:failed': (data: { transferId: string; error: string }) => void;
  error: (message: string) => void;
}

interface ClientToServerEvents {
  'user:join': (data: { userId?: string; username: string }) => void;
  'user:rename': (data: { username: string }) => void;
  'message:send': (data: { toId: string; text: string }) => void;
  'transfer:notify': (data: {
    transferId: string;
    toId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});