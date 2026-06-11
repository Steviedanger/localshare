import { Server, Socket } from 'socket.io';
import { prisma } from '../../db/prisma';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  Device,
} from '../../types';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// In-memory map of socketId -> Device (online devices only)
export const deviceMap = new Map<string, Device>();

export function broadcastDeviceList(io: IO): void {
  const devices = Array.from(deviceMap.values());
  io.emit('device:list', devices);
}

export async function handleJoin(
  io: IO,
  socket: AppSocket,
  payload: { userId?: string; username: string },
): Promise<void> {
  const { username } = payload;

  let user = payload.userId
    ? await prisma.user.findUnique({ where: { id: payload.userId } })
    : null;

  if (!user) {
    let finalUsername = username || `Device-${socket.id.slice(0, 4).toUpperCase()}`;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${username}${suffix++}`;
    }
    user = await prisma.user.create({
      data: { username: finalUsername, socketId: socket.id },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { socketId: socket.id, },
    });
  }

  socket.data.userId = user.id;
  socket.data.username = user.username;

  deviceMap.set(socket.id, {
    id: user.id,
    username: user.username,
    socketId: socket.id,
    lastSeen: new Date().toISOString(),
  });

  // Tell THIS socket who they are
  socket.emit('user:welcome', { userId: user.id, username: user.username });

  console.log(`✅ ${user.username} joined (socket: ${socket.id})`);
  broadcastDeviceList(io);
}

export async function handleDisconnect(io: IO, socket: AppSocket): Promise<void> {
  const device = deviceMap.get(socket.id);
  if (!device) return;

  deviceMap.delete(socket.id);

  await prisma.user.update({
    where: { id: device.id },
    data: { socketId: null },
  }).catch(() => {});

  console.log(`👋 ${device.username} disconnected`);
  broadcastDeviceList(io);
}

export async function handleRename(
  io: IO,
  socket: AppSocket,
  payload: { username: string },
): Promise<void> {
  const { userId } = socket.data;
  if (!userId) return;

  const trimmed = payload.username.trim().slice(0, 32);
  if (!trimmed) return;

  try {
    const existing = await prisma.user.findUnique({ where: { username: trimmed } });
    if (existing && existing.id !== userId) {
      socket.emit('error', 'Username already taken');
      return;
    }

    await prisma.user.update({ where: { id: userId }, data: { username: trimmed } });

    const device = deviceMap.get(socket.id);
    if (device) {
      device.username = trimmed;
      socket.data.username = trimmed;
    }

    io.emit('user:renamed', { userId, username: trimmed });
    broadcastDeviceList(io);
  } catch (_err) {
    socket.emit('error', 'Rename failed');
  }
}