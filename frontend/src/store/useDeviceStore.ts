// Zustand store: online devices list + local user identity

import { create } from 'zustand';
import { Device } from '../types';

interface DeviceState {
  devices: Device[];
  localUser: Device | null;
  selectedDeviceId: string | null;

  setDevices: (devices: Device[]) => void;
  setLocalUser: (user: Device) => void;
  setSelectedDevice: (id: string | null) => void;
  updateUsername: (userId: string, username: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  localUser: null,
  selectedDeviceId: null,

  setDevices: (devices) => set({ devices }),

  setLocalUser: (user) => set({ localUser: user }),

  setSelectedDevice: (id) => set({ selectedDeviceId: id }),

  updateUsername: (userId, username) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === userId ? { ...d, username } : d)),
      localUser:
        state.localUser?.id === userId
          ? { ...state.localUser, username }
          : state.localUser,
    })),
}));
