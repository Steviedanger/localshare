/**
 * sockets/types.ts
 * Typed Socket.IO event maps — used on both server and (shared with) client.
 * ServerToClient: events the server emits that clients receive.
 * ClientToServer: events clients emit that the server handles.
 */
import type { Device, Message, TransferMeta, TransferProgress, TransferComplete } from '../types';

export interface ServerToClientEvents {
  /** Broadcast full device list whenever it changes */
  'device:list': (devices: Device[]) => void;

  /** Server confirms our own identity after join */
  'user:welcome': (data: { userId: string; username: string }) => void;

  /** Someone renamed themselves */
  'user:renamed': (data: { userId: string; username: string }) => void;

  /** A direct message arrived for this socket */
  'message:receive': (message: Message) => void;

  /** A sender is starting a file transfer to this device */
  'transfer:incoming': (meta: TransferMeta) => void;

  /** Upload progress (sent back to the uploader) */
  'transfer:progress': (progress: TransferProgress) => void;

  /** Transfer finished — download URL is ready */
  'transfer:complete': (result: TransferComplete) => void;

  /** Transfer failed */
  'transfer:error': (data: { transferId: string; error: string }) => void;
}

export interface ClientToServerEvents {
  /** Register / announce this device */
  'user:join': (data: { userId?: string; username: string }) => void;

  /** Rename this device */
  'user:rename': (data: { username: string }) => void;

  /** Send a chat message */
  'message:send': (data: { toId: string; text: string; timestamp: string }) => void;

  /** Announce an upcoming file transfer */
  'transfer:start': (data: {
    transferId: string;
    toId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}
