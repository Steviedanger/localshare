// Frontend domain types

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

export type TransferStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export interface Transfer {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  status: TransferStatus;
  percent: number;
  downloadUrl?: string;
  direction: 'sent' | 'received';
  timestamp: string;
}
