import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prisma';
import { upload, uploadDir } from '../middleware/upload';
import { notifyTransferComplete } from '../sockets/handlers/transfer';
import { AppIO } from '../sockets';

export const filesRouter = Router();

// Inject io instance so the upload route can emit socket events
let _io: AppIO;
export function setIO(io: AppIO) { _io = io; }

// Upload a file and record the transfer in the database
filesRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { senderId, receiverId, transferId } = req.body;
    if (!senderId || !receiverId || !transferId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing senderId, receiverId, or transferId' });
    }

    // Upsert transfer record
    const transfer = await prisma.transfer.upsert({
      where: { id: transferId },
      create: {
        id: transferId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: BigInt(req.file.size),
        storagePath: req.file.path,
        status: 'COMPLETED',
        completedAt: new Date(),
        senderId,
        receiverId,
      },
      update: {
        storagePath: req.file.path,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    const downloadUrl = `/api/files/download/${transfer.id}`;

    // Notify both sender and receiver via socket that the transfer is done
    if (_io) {
      notifyTransferComplete(
        _io,
        transferId,
        downloadUrl,
        req.file.originalname,
        senderId,
        receiverId,
      );
    }

    res.json({ transferId: transfer.id, downloadUrl, filename: req.file.originalname });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Stream a file to the client for download
filesRouter.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    if (!fs.existsSync(transfer.storagePath)) {
      return res.status(404).json({ error: 'File no longer available on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${transfer.filename}"`);
    res.setHeader('Content-Type', transfer.mimeType);
    res.setHeader('Content-Length', transfer.sizeBytes.toString());
    fs.createReadStream(transfer.storagePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get transfer history for a user
filesRouter.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [{ senderId: req.params.userId }, { receiverId: req.params.userId }],
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });
    res.json(transfers.map((t) => ({ ...t, sizeBytes: Number(t.sizeBytes) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});