// REST routes for user management
// GET  /api/users          — list all online users
// GET  /api/users/:id      — get a specific user
// PATCH /api/users/:id     — rename a user

import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { z } from 'zod';

export const usersRouter = Router();

// List all users (online first, sorted by username)
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ socketId: 'desc' }, { username: 'asc' }],
      select: { id: true, username: true, socketId: true, lastSeen: true },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, socketId: true, lastSeen: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const RenameSchema = z.object({
  username: z.string().min(1).max(32).trim(),
});

// Rename a user — also broadcasts via socket (see socket handler)
usersRouter.patch('/:id', async (req: Request, res: Response) => {
  const parsed = RenameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { username: parsed.data.username },
      select: { id: true, username: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename user' });
  }
});
