// LocalShare Hub — main entry point
// Bootstraps Express, Socket.IO, mDNS advertisement, and static file serving

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';

import { env } from './config/env';
import { prisma } from './db/prisma';
import { advertiseService, stopAdvertising } from './discovery/mdns';
import { usersRouter } from './routes/users';
import { filesRouter } from './routes/files';
import { registerSocketHandlers } from './sockets';
import { errorHandler } from './middleware/errorHandler';
import { uploadDir } from './middleware/upload';

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow all origins on the local network; restrict if CORS_ORIGINS is set
const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : true; // true = reflect any origin

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ── Static file serving ───────────────────────────────────────────────────────
// Serve uploaded files for download
app.use('/uploads', express.static(uploadDir));

// In production, serve the built React frontend
if (env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── API routes ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);

// ── Error handler (must be last middleware) ──────────────────────────────────
app.use(errorHandler);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  // Increase max buffer size for large file metadata (not file bytes — those go via HTTP)
  maxHttpBufferSize: 1e6,
});

registerSocketHandlers(io);

// ── Start server ──────────────────────────────────────────────────────────────
async function main() {
  // Verify database connection
  await prisma.$connect();
  console.log('✅ Database connected');

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 LocalShare hub running on http://0.0.0.0:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Upload dir:  ${uploadDir}`);

    // Advertise on the local network via mDNS
    advertiseService(env.PORT);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
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
