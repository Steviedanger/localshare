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

export type TransferStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface Transfer {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: TransferStatus;
  progress: number;
  previewUrl?: string;
  downloadUrl?: string;
  direction: 'sent' | 'received';
  peerId: string;
  peerUsername: string;
  timestamp: string;
}