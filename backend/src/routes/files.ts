import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prisma';
import { upload } from '../middleware/upload';
import { notifyTransferComplete } from '../sockets/handlers/transfer';
import { AppIO } from '../sockets';

export const filesRouter = Router();

let _io: AppIO;
export function setIO(io: AppIO) { _io = io; }

// POST /api/files/upload
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

    // Use preview URL as the primary URL — inline preview works,
    // and the Save button will use the download URL separately
    const previewUrl  = `/api/files/preview/${transfer.id}`;
    const downloadUrl = `/api/files/download/${transfer.id}`;

    if (_io) {
      notifyTransferComplete(
        _io,
        transferId,
        previewUrl,   // sent as downloadUrl to the socket — TransferItem uses this for img src
        req.file.originalname,
        senderId,
        receiverId,
      );
    }

    res.json({
      transferId: transfer.id,
      previewUrl,
      downloadUrl,
      filename: req.file.originalname,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/files/preview/:id
// Streams the file inline — no Content-Disposition: attachment
// Used by img, video, and iframe tags for inline preview
filesRouter.get('/preview/:id', async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    if (!fs.existsSync(transfer.storagePath)) {
      return res.status(404).json({ error: 'File no longer available on disk' });
    }

    // inline — browser renders it, does NOT trigger download
    res.setHeader('Content-Disposition', `inline; filename="${transfer.filename}"`);
    res.setHeader('Content-Type', transfer.mimeType);
    res.setHeader('Content-Length', transfer.sizeBytes.toString());
    fs.createReadStream(transfer.storagePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Preview failed' });
  }
});

// GET /api/files/download/:id
// Forces a download — used by the Save button only
filesRouter.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    if (!fs.existsSync(transfer.storagePath)) {
      return res.status(404).json({ error: 'File no longer available on disk' });
    }

    // attachment — forces browser download dialog
    res.setHeader('Content-Disposition', `attachment; filename="${transfer.filename}"`);
    res.setHeader('Content-Type', transfer.mimeType);
    res.setHeader('Content-Length', transfer.sizeBytes.toString());
    fs.createReadStream(transfer.storagePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// GET /api/files/history/:userId
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