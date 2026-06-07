// Zustand store: file transfers (in-progress + completed)

import { create } from 'zustand';
import { Transfer } from '../types';

interface TransferState {
  transfers: Record<string, Transfer>; // keyed by transferId

  addTransfer: (transfer: Transfer) => void;
  updateProgress: (transferId: string, percent: number) => void;
  markComplete: (transferId: string, downloadUrl: string) => void;
  markFailed: (transferId: string, error: string) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: {},

  addTransfer: (transfer) =>
    set((state) => ({
      transfers: { ...state.transfers, [transfer.id]: transfer },
    })),

  updateProgress: (transferId, percent) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transferId]: { ...state.transfers[transferId], percent, status: 'uploading' },
      },
    })),

  markComplete: (transferId, downloadUrl) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transferId]: {
          ...state.transfers[transferId],
          status: 'complete',
          percent: 100,
          downloadUrl,
        },
      },
    })),

  markFailed: (transferId, _error) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transferId]: { ...state.transfers[transferId], status: 'failed' },
      },
    })),
}));
