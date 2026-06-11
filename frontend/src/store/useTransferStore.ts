import { create } from 'zustand';
import { Transfer } from '../types';

interface TransferState {
  transfers: Transfer[];

  addTransfer: (transfer: Transfer) => void;
  updateProgress: (transferId: string, percent: number) => void;
  completeTransfer: (transferId: string, downloadUrl: string) => void;
  failTransfer: (transferId: string) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: [],

  addTransfer: (transfer) =>
    set((state) => ({
      transfers: [transfer, ...state.transfers],
    })),

  updateProgress: (transferId, percent) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId
          ? { ...t, progress: percent, status: 'uploading' as const }
          : t
      ),
    })),

  completeTransfer: (transferId, downloadUrl) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId
          ? { ...t, 
              progress: 100,
              status: 'completed' as const,
              previewUrl: downloadUrl,
              downloadUrl: downloadUrl.replace('/preview/', '/download/') }
          : t
      ),
    })),

  failTransfer: (transferId) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId
          ? { ...t, status: 'failed' as const }
          : t
      ),
    })),
}));