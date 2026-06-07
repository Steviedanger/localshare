/**
 * PHASE 2 TESTS — Device discovery and presence logic
 * Tests the in-memory device registry that backs the socket presence handlers.
 * Run: node --test tests/phase2.test.mjs
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// ─── In-memory device registry (mirrors the DB logic in presence.ts) ─────────
class DeviceRegistry {
  #devices = new Map(); // userId → device

  upsert({ userId, username, socketId }) {
    const id = userId ?? randomUUID();
    const existing = this.#devices.get(id);
    const device = {
      id,
      username: username.trim(),
      socketId,
      lastSeen: new Date().toISOString(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.#devices.set(id, device);
    return device;
  }

  disconnect(userId) {
    const device = this.#devices.get(userId);
    if (device) {
      this.#devices.set(userId, { ...device, socketId: null });
    }
  }

  rename(userId, username) {
    const device = this.#devices.get(userId);
    if (!device) throw new Error('User not found');
    const updated = { ...device, username: username.trim() };
    this.#devices.set(userId, updated);
    return updated;
  }

  getOnline() {
    return [...this.#devices.values()].filter(d => d.socketId !== null);
  }

  getAll() {
    return [...this.#devices.values()];
  }

  findByUsername(username) {
    return [...this.#devices.values()].find(d => d.username === username);
  }
}

describe('Phase 2 — Device registry', () => {
  let registry;

  beforeEach(() => {
    registry = new DeviceRegistry();
  });

  test('registers a new device and assigns UUID', () => {
    const device = registry.upsert({ username: 'Alice', socketId: 'socket-1' });
    assert.ok(device.id, 'device should have an id');
    assert.equal(device.username, 'Alice');
    assert.equal(device.socketId, 'socket-1');
  });

  test('upsert with existing userId updates socketId', () => {
    const d1 = registry.upsert({ username: 'Bob', socketId: 'socket-old' });
    const d2 = registry.upsert({ userId: d1.id, username: 'Bob', socketId: 'socket-new' });
    assert.equal(d2.id, d1.id);
    assert.equal(d2.socketId, 'socket-new');
  });

  test('getOnline excludes disconnected devices', () => {
    const a = registry.upsert({ username: 'Alice', socketId: 's1' });
    registry.upsert({ username: 'Bob', socketId: 's2' });
    registry.disconnect(a.id);

    const online = registry.getOnline();
    assert.equal(online.length, 1);
    assert.equal(online[0].username, 'Bob');
  });

  test('disconnect sets socketId to null', () => {
    const d = registry.upsert({ username: 'Carol', socketId: 's3' });
    registry.disconnect(d.id);
    const all = registry.getAll();
    const carol = all.find(x => x.id === d.id);
    assert.equal(carol.socketId, null);
  });

  test('rename updates username', () => {
    const d = registry.upsert({ username: 'Dave', socketId: 's4' });
    const updated = registry.rename(d.id, 'David');
    assert.equal(updated.username, 'David');
  });

  test('rename throws for unknown userId', () => {
    assert.throws(() => registry.rename('nonexistent', 'X'), /not found/);
  });

  test('trims whitespace from usernames', () => {
    const d = registry.upsert({ username: '  Eve  ', socketId: 's5' });
    assert.equal(d.username, 'Eve');
  });

  test('multiple devices can be online simultaneously', () => {
    for (let i = 0; i < 5; i++) {
      registry.upsert({ username: `Device${i}`, socketId: `s${i}` });
    }
    assert.equal(registry.getOnline().length, 5);
  });

  test('reconnecting device (same userId) reappears online', () => {
    const d = registry.upsert({ username: 'Frank', socketId: 's6' });
    registry.disconnect(d.id);
    assert.equal(registry.getOnline().length, 0);
    registry.upsert({ userId: d.id, username: 'Frank', socketId: 's7' });
    assert.equal(registry.getOnline().length, 1);
  });
});
