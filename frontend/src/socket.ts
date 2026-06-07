// Socket.IO client singleton
// Import this anywhere to get the same connected socket instance

import { io, Socket } from 'socket.io-client';

// In dev, Vite proxies /socket.io to localhost:3001
// In production, the backend serves both API and frontend on the same port
const URL = import.meta.env.PROD ? window.location.origin : '';

export const socket: Socket = io(URL, {
  autoConnect: false, // We connect manually after the user sets a username
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
