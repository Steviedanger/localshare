/**
 * PHASE 3 TESTS — Messaging logic
 * Tests message routing, validation, and the in-memory conversation store.
 * Run: node --test tests/phase3.test.mjs
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// ─── Message router (mirrors message.ts handler logic) ───────────────────────
class MessageRouter {
  #delivered = []; // captured outbound messages for assertions

  route({ fromId, fromUsername, toSocketId, toId, text, timestamp }) {
    if (!fromId || !fromUsername) return { ok: false, error: 'unauthenticated' };
    if (!toSocketId) return { ok: false, error: 'recipient offline' };
    if (!text || !text.trim()) return { ok: false, error: 'empty message' };

    const message = {
      id: randomUUID(),
      fromId,
      fromUsername,
      toId,
      text: text.trim(),
      timestamp,
    };

    this.#delivered.push({ socketId: toSocketId, message });
    // Echo to sender
    this.#delivered.push({ socketId: 'sender-socket', message });

    return { ok: true, message };
  }

  getDelivered() { return [...this.#delivered]; }
  clear() { this.#delivered = []; }
}

// ─── In-memory conversation store (mirrors useMessageStore.ts) ───────────────
class ConversationStore {
  #conversations = {};
  #unread = {};

  addMessage(peerId, message) {
    if (!this.#conversations[peerId]) this.#conversations[peerId] = [];
    this.#conversations[peerId].push(message);
    this.#unread[peerId] = (this.#unread[peerId] ?? 0) + 1;
  }

  markRead(peerId) {
    this.#unread[peerId] = 0;
  }

  getMessages(peerId) {
    return this.#conversations[peerId] ?? [];
  }

  getUnread(peerId) {
    return this.#unread[peerId] ?? 0;
  }
}

describe('Phase 3 — Message routing', () => {
  let router;

  beforeEach(() => { router = new MessageRouter(); });

  test('routes a valid message to recipient socket', () => {
    const result = router.route({
      fromId: 'user-1', fromUsername: 'Alice',
      toSocketId: 'socket-bob', toId: 'user-2',
      text: 'Hello Bob!', timestamp: new Date().toISOString(),
    });
    assert.equal(result.ok, true);
    assert.ok(result.message.id);
    assert.equal(result.message.text, 'Hello Bob!');
  });

  test('delivers to both recipient and sender (echo)', () => {
    router.route({
      fromId: 'u1', fromUsername: 'Alice',
      toSocketId: 'socket-bob', toId: 'u2',
      text: 'Hi', timestamp: new Date().toISOString(),
    });
    assert.equal(router.getDelivered().length, 2);
    const sockets = router.getDelivered().map(d => d.socketId);
    assert.ok(sockets.includes('socket-bob'));
    assert.ok(sockets.includes('sender-socket'));
  });

  test('rejects unauthenticated sender', () => {
    const result = router.route({
      fromId: '', fromUsername: '',
      toSocketId: 'socket-bob', toId: 'u2',
      text: 'Hi', timestamp: new Date().toISOString(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'unauthenticated');
  });

  test('rejects message to offline recipient', () => {
    const result = router.route({
      fromId: 'u1', fromUsername: 'Alice',
      toSocketId: null, toId: 'u2',
      text: 'Hi', timestamp: new Date().toISOString(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'recipient offline');
  });

  test('rejects empty or whitespace-only message', () => {
    const result = router.route({
      fromId: 'u1', fromUsername: 'Alice',
      toSocketId: 'socket-bob', toId: 'u2',
      text: '   ', timestamp: new Date().toISOString(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'empty message');
  });

  test('trims text before storing', () => {
    const result = router.route({
      fromId: 'u1', fromUsername: 'Alice',
      toSocketId: 'socket-bob', toId: 'u2',
      text: '  hello  ', timestamp: new Date().toISOString(),
    });
    assert.equal(result.message.text, 'hello');
  });
});

describe('Phase 3 — Conversation store', () => {
  let store;

  beforeEach(() => { store = new ConversationStore(); });

  test('stores messages per peerId', () => {
    const m = { id: randomUUID(), fromId: 'u1', fromUsername: 'A', toId: 'u2', text: 'hi', timestamp: '' };
    store.addMessage('u2', m);
    assert.equal(store.getMessages('u2').length, 1);
  });

  test('empty conversation returns []', () => {
    assert.deepEqual(store.getMessages('nobody'), []);
  });

  test('tracks unread count', () => {
    const m = { id: randomUUID(), fromId: 'u1', fromUsername: 'A', toId: 'u2', text: 'hi', timestamp: '' };
    store.addMessage('u2', m);
    store.addMessage('u2', { ...m, id: randomUUID() });
    assert.equal(store.getUnread('u2'), 2);
  });

  test('markRead resets unread to 0', () => {
    const m = { id: randomUUID(), fromId: 'u1', fromUsername: 'A', toId: 'u2', text: 'hi', timestamp: '' };
    store.addMessage('u2', m);
    store.markRead('u2');
    assert.equal(store.getUnread('u2'), 0);
  });

  test('conversations for different peers are independent', () => {
    const msg = (to) => ({ id: randomUUID(), fromId: 'u1', fromUsername: 'A', toId: to, text: 'x', timestamp: '' });
    store.addMessage('peer-A', msg('peer-A'));
    store.addMessage('peer-A', msg('peer-A'));
    store.addMessage('peer-B', msg('peer-B'));
    assert.equal(store.getMessages('peer-A').length, 2);
    assert.equal(store.getMessages('peer-B').length, 1);
  });
});
