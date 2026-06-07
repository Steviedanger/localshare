/**
 * hooks/useLocalUser.ts
 * Reads/writes the local user's identity and handles renaming.
 */
import { socket } from '../socket';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api';

export function useLocalUser() {
  const self = useDeviceStore((s) => s.self);
  const setSelf = useDeviceStore((s) => s.setSelf);

  async function rename(newUsername: string) {
    const trimmed = newUsername.trim();
    if (!trimmed || !self) return;

    // Optimistically update local state
    setSelf({ ...self, username: trimmed });
    localStorage.setItem('localshare:username', trimmed);

    // Tell the server via both REST (persists to DB) and socket (broadcasts to peers)
    await api.patch(`/users/${self.userId}`, { username: trimmed });
    socket.emit('user:rename', { username: trimmed });
  }

  return { self, rename };
}
