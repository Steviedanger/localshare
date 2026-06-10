import { create } from 'zustand';
import { Device } from '../types';

interface DeviceState {
  devices: Device[];
  self: { userId: string; username: string } | null;
  selectedDeviceId: string | null;

  setDevices: (devices: Device[]) => void;
  setSelf: (self: { userId: string; username: string }) => void;
  setSelectedDevice: (id: string | null) => void;
  updateUsername: (userId: string, username: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  self: null,
  selectedDeviceId: null,

  setDevices: (devices) => set({ devices }),

  setSelf: (self) => set({ self }),

  setSelectedDevice: (id) => set({ selectedDeviceId: id }),

  updateUsername: (userId, username) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === userId ? { ...d, username } : d
      ),
      self:
        state.self?.userId === userId
          ? { ...state.self, username }
          : state.self,
    })),
}));