import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';

import { env } from './config/env';
import { prisma } from './db/prisma';
import { advertiseService, stopAdvertising } from './discovery/mdns';
import { usersRouter } from './routes/users';
import { filesRouter, setIO } from './routes/files';
import { registerSocketHandlers } from './sockets';
import { errorHandler } from './middleware/errorHandler';
import { uploadDir } from './middleware/upload';

const app = express();
const server = http.createServer(app);

// CORS — allow all LAN origins if CORS_ORIGINS not set
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o: string) => o.trim())
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve uploaded files as static assets for download
app.use('/uploads', express.static(uploadDir));

// In production, serve the built React frontend
if (env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

// API routes
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);

app.use(errorHandler);

// Socket.IO
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e6,
});

registerSocketHandlers(io);

// Inject io into the files route so uploads can emit completion events
setIO(io);

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`\n┌─────────────────────────────────────┐`);
    console.log(`│  🚀  LocalShare Hub is running        │`);
    console.log(`│  Port : ${env.PORT}                        │`);
    console.log(`│  Env  : ${env.NODE_ENV.padEnd(11)}              │`);
    console.log(`└─────────────────────────────────────┘\n`);
    advertiseService(env.PORT);
  });
}

process.on('SIGINT', async () => {
  console.log('\n⏹  Shutting down...');
  stopAdvertising();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  stopAdvertising();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});