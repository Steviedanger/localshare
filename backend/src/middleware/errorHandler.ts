// Global Express error handler — catches errors thrown in route handlers

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Multer file size exceeded
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'File too large' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
}
