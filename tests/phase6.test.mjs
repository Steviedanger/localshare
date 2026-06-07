/**
 * PHASE 6 TESTS — Integration scenarios and edge cases
 * Full end-to-end scenarios using only in-memory logic.
 * Run: node --test tests/phase6.test.mjs
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// ─── Reusable minimal implementations ────────────────────────────────────────
class Hub {
  #devices = new Map();
  #transfers = new Map();
  #emitted = [];

  // ── Device management ─────────────────────────────────────────────────────
  join(username, socketId, userId) {
    const id = userId ?? randomUUID();
    const device = { id, username: username.trim(), socketId, lastSeen: Date.now() };
    this.#devices.set(id, device);
    this.#emit('ALL', 'device:list', this.onlineDevices());
    return device;
  }

  disconnect(userId) {
    const d = this.#devices.get(userId);
    if (d) {
      this.#devices.set(userId, { ...d, socketId: null });
      this.#emit('ALL', 'device:list', this.onlineDevices());
    }
  }

  rename(userId, newName) {
    const d = this.#devices.get(userId);
    if (!d) throw new Error('not found');
    const updated = { ...d, username: newName.trim() };
    this.#devices.set(userId, updated);
    this.#emit('ALL', 'user:renamed', { userId, username: newName.trim() });
    return updated;
  }

  onlineDevices() {
    return [...this.#devices.values()].filter(d => d.socketId);
  }

  // ── Messaging ─────────────────────────────────────────────────────────────
  sendMessage(fromId, toId, text) {
    const from = this.#devices.get(fromId);
    const to = this.#devices.get(toId);
    if (!from) return { ok: false, error: 'sender unknown' };
    if (!to?.socketId) return { ok: false, error: 'recipient offline' };

    const msg = { id: randomUUID(), fromId, fromUsername: from.username, toId, text, timestamp: new Date().toISOString() };
    this.#emit(to.socketId, 'message:receive', msg);
    this.#emit(from.socketId, 'message:receive', msg);
    return { ok: true, msg };
  }

  // ── File transfer ─────────────────────────────────────────────────────────
  startTransfer({ transferId, fromId, toId, filename, sizeBytes }) {
    const from = this.#devices.get(fromId);
    const to = this.#devices.get(toId);
    if (!to?.socketId) return { ok: false, error: 'recipient offline' };

    this.#transfers.set(transferId, { id: transferId, fromId, toId, filename, sizeBytes, status: 'PENDING' });
    this.#emit(to.socketId, 'transfer:incoming', {
      id: transferId, filename, sizeBytes, senderId: fromId, senderUsername: from.username, receiverId: toId
    });
    return { ok: true };
  }

  completeTransfer(transferId) {
    const t = this.#transfers.get(transferId);
    if (!t) return { ok: false, error: 'not found' };
    const updated = { ...t, status: 'COMPLETED' };
    this.#transfers.set(transferId, updated);

    const from = this.#devices.get(t.fromId);
    const to = this.#devices.get(t.toId);
    const payload = { transferId, filename: t.filename, downloadUrl: `/api/download/${transferId}`, sizeBytes: t.sizeBytes };

    if (from?.socketId) this.#emit(from.socketId, 'transfer:complete', payload);
    if (to?.socketId)   this.#emit(to.socketId,   'transfer:complete', payload);
    return { ok: true };
  }

  // ── Internal ──────────────────────────────────────────────────────────────
  #emit(target, event, data) {
    this.#emitted.push({ target, event, data, ts: Date.now() });
  }

  emitted(event) { return this.#emitted.filter(e => e.event === event); }
  clearEmitted()  { this.#emitted = []; }
}

describe('Phase 6 — Full join → message → transfer scenario', () => {
  let hub;

  beforeEach(() => { hub = new Hub(); });

  test('two devices join and both see each other in device list', () => {
    hub.join('Alice', 's-alice');
    hub.join('Bob', 's-bob');
    const lists = hub.emitted('device:list');
    const last = lists[lists.length - 1];
    assert.equal(last.data.length, 2);
    const names = last.data.map(d => d.username).sort();
    assert.deepEqual(names, ['Alice', 'Bob']);
  });

  test('message is delivered to both sender and recipient', () => {
    const alice = hub.join('Alice', 's-alice');
    const bob   = hub.join('Bob',   's-bob');
    hub.clearEmitted();

    hub.sendMessage(alice.id, bob.id, 'Hey Bob!');
    const msgs = hub.emitted('message:receive');
    assert.equal(msgs.length, 2);
    assert.ok(msgs.some(m => m.target === 's-alice'));
    assert.ok(msgs.some(m => m.target === 's-bob'));
  });

  test('full file transfer flow emits incoming then complete', () => {
    const alice = hub.join('Alice', 's-alice');
    const bob   = hub.join('Bob',   's-bob');
    hub.clearEmitted();

    const tid = randomUUID();
    const startResult = hub.startTransfer({ transferId: tid, fromId: alice.id, toId: bob.id, filename: 'photo.jpg', sizeBytes: 2048 });
    assert.equal(startResult.ok, true);

    const incoming = hub.emitted('transfer:incoming');
    assert.equal(incoming.length, 1);
    assert.equal(incoming[0].target, 's-bob');

    const completeResult = hub.completeTransfer(tid);
    assert.equal(completeResult.ok, true);

    const complete = hub.emitted('transfer:complete');
    assert.equal(complete.length, 2); // both sender and receiver
    assert.ok(complete.every(e => e.data.downloadUrl.includes(tid)));
  });

  test('device list shrinks after disconnect', () => {
    const alice = hub.join('Alice', 's-alice');
    hub.join('Bob', 's-bob');
    hub.disconnect(alice.id);

    const lists = hub.emitted('device:list');
    const last = lists[lists.length - 1];
    assert.equal(last.data.length, 1);
    assert.equal(last.data[0].username, 'Bob');
  });

  test('rename propagates to all clients', () => {
    const alice = hub.join('Alice', 's-alice');
    hub.join('Bob', 's-bob');
    hub.clearEmitted();

    hub.rename(alice.id, 'Alice-Renamed');
    const renames = hub.emitted('user:renamed');
    assert.equal(renames.length, 1);
    assert.equal(renames[0].data.username, 'Alice-Renamed');
  });

  test('message to offline user fails gracefully', () => {
    const alice = hub.join('Alice', 's-alice');
    const bob   = hub.join('Bob', 's-bob');
    hub.disconnect(bob.id);

    const result = hub.sendMessage(alice.id, bob.id, 'Hello?');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'recipient offline');
  });

  test('transfer to offline user fails gracefully', () => {
    const alice = hub.join('Alice', 's-alice');
    const bob   = hub.join('Bob', 's-bob');
    hub.disconnect(bob.id);

    const result = hub.startTransfer({ transferId: randomUUID(), fromId: alice.id, toId: bob.id, filename: 'f.txt', sizeBytes: 100 });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'recipient offline');
  });

  test('reconnecting user restores presence', () => {
    const alice = hub.join('Alice', 's-old');
    hub.disconnect(alice.id);
    hub.join('Alice', 's-new', alice.id); // re-join with same userId

    const online = hub.onlineDevices();
    assert.equal(online.length, 1);
    assert.equal(online[0].socketId, 's-new');
  });

  test('handles 10 concurrent devices', () => {
    for (let i = 0; i < 10; i++) hub.join(`Device${i}`, `s${i}`);
    assert.equal(hub.onlineDevices().length, 10);
  });

  test('completed transfer download URL contains transferId', () => {
    const alice = hub.join('Alice', 's-alice');
    const bob   = hub.join('Bob', 's-bob');
    const tid = randomUUID();
    hub.startTransfer({ transferId: tid, fromId: alice.id, toId: bob.id, filename: 'doc.pdf', sizeBytes: 1024 });
    hub.completeTransfer(tid);

    const complete = hub.emitted('transfer:complete');
    assert.ok(complete[0].data.downloadUrl === `/api/download/${tid}`);
  });
});
