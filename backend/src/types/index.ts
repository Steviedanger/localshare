export interface Device {
  id: string;
  username: string;
  socketId: string;
  lastSeen: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromUsername: string;
  toId: string;
  text: string;
  timestamp: string;
}

export interface TransferMeta {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  senderId: string;
  senderUsername: string;
  receiverId: string;
}

export interface TransferProgress {
  transferId: string;
  percent: number;
  bytesUploaded: number;
}

export interface TransferComplete {
  transferId: string;
  downloadUrl: string;
  filename: string;
}

export interface ServerToClientEvents {
  'device:list': (devices: Device[]) => void;
  'user:welcome': (payload: { userId: string; username: string }) => void;
  'user:renamed': (payload: { userId: string; username: string }) => void;
  'message:receive': (message: Message) => void;
  'transfer:incoming': (meta: TransferMeta) => void;
  'transfer:progress': (progress: TransferProgress) => void;
  'transfer:complete': (complete: TransferComplete) => void;
  'transfer:failed': (payload: { transferId: string; error: string }) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'user:join': (payload: { userId?: string; username: string }) => void;
  'user:rename': (payload: { username: string }) => void;
  'message:send': (payload: { toId: string; text: string }) => void;
  'transfer:notify': (payload: {
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