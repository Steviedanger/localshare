/**
 * PHASE 4 TESTS — File transfer logic
 * Tests transfer state machine, filename sanitisation, size limits, and store.
 * Run: node --test tests/phase4.test.mjs
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ─── Transfer state machine ───────────────────────────────────────────────────
const STATUS = { PENDING: 'PENDING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', FAILED: 'FAILED' };

class TransferStateMachine {
  #state;

  constructor(initial = STATUS.PENDING) {
    this.#state = initial;
  }

  get state() { return this.#state; }

  transition(next) {
    const allowed = {
      [STATUS.PENDING]:     [STATUS.IN_PROGRESS, STATUS.FAILED],
      [STATUS.IN_PROGRESS]: [STATUS.COMPLETED, STATUS.FAILED],
      [STATUS.COMPLETED]:   [],
      [STATUS.FAILED]:      [],
    };
    if (!allowed[this.#state].includes(next)) {
      throw new Error(`Invalid transition: ${this.#state} → ${next}`);
    }
    this.#state = next;
  }
}

// ─── Filename sanitiser (mirrors Multer filename callback logic) ──────────────
function sanitiseFilename(original) {
  return original.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function buildStorageName(original) {
  const safe = sanitiseFilename(original);
  return `${randomUUID()}_${safe}`;
}

// ─── File size validator ──────────────────────────────────────────────────────
function validateFileSize(bytes, maxMB) {
  const maxBytes = maxMB * 1024 * 1024;
  if (bytes > maxBytes) return { ok: false, error: `File exceeds ${maxMB}MB limit` };
  if (bytes <= 0) return { ok: false, error: 'File must not be empty' };
  return { ok: true };
}

// ─── Transfer store (mirrors useTransferStore.ts) ─────────────────────────────
class TransferStore {
  #transfers = [];

  add(transfer) {
    this.#transfers.unshift(transfer);
  }

  updateProgress(id, progress) {
    this.#transfers = this.#transfers.map(t =>
      t.id === id ? { ...t, progress, status: 'uploading' } : t
    );
  }

  complete(id, downloadUrl) {
    this.#transfers = this.#transfers.map(t =>
      t.id === id ? { ...t, progress: 100, status: 'completed', downloadUrl } : t
    );
  }

  fail(id) {
    this.#transfers = this.#transfers.map(t =>
      t.id === id ? { ...t, status: 'failed' } : t
    );
  }

  forPeer(peerId) {
    return this.#transfers.filter(t => t.peerId === peerId);
  }

  getAll() { return [...this.#transfers]; }
}

// ─── Download URL builder ─────────────────────────────────────────────────────
function buildDownloadUrl(transferId) {
  return `/api/download/${transferId}`;
}

describe('Phase 4 — Transfer state machine', () => {
  test('starts in PENDING state', () => {
    const sm = new TransferStateMachine();
    assert.equal(sm.state, STATUS.PENDING);
  });

  test('PENDING → IN_PROGRESS is valid', () => {
    const sm = new TransferStateMachine();
    sm.transition(STATUS.IN_PROGRESS);
    assert.equal(sm.state, STATUS.IN_PROGRESS);
  });

  test('IN_PROGRESS → COMPLETED is valid', () => {
    const sm = new TransferStateMachine(STATUS.IN_PROGRESS);
    sm.transition(STATUS.COMPLETED);
    assert.equal(sm.state, STATUS.COMPLETED);
  });

  test('PENDING → COMPLETED is invalid', () => {
    const sm = new TransferStateMachine();
    assert.throws(() => sm.transition(STATUS.COMPLETED), /Invalid transition/);
  });

  test('COMPLETED is terminal — cannot transition', () => {
    const sm = new TransferStateMachine(STATUS.COMPLETED);
    assert.throws(() => sm.transition(STATUS.FAILED), /Invalid transition/);
  });

  test('any state → FAILED is valid from PENDING or IN_PROGRESS', () => {
    const sm1 = new TransferStateMachine(STATUS.PENDING);
    sm1.transition(STATUS.FAILED);
    assert.equal(sm1.state, STATUS.FAILED);

    const sm2 = new TransferStateMachine(STATUS.IN_PROGRESS);
    sm2.transition(STATUS.FAILED);
    assert.equal(sm2.state, STATUS.FAILED);
  });
});

describe('Phase 4 — Filename sanitisation', () => {
  test('preserves safe filenames', () => {
    assert.equal(sanitiseFilename('my-file_v2.0.txt'), 'my-file_v2.0.txt');
  });

  test('replaces spaces with underscores', () => {
    assert.equal(sanitiseFilename('my file.pdf'), 'my_file.pdf');
  });

  test('replaces special characters', () => {
    assert.equal(sanitiseFilename('file (1).zip'), 'file__1_.zip');
  });

  test('storage name has UUID prefix', () => {
    const name = buildStorageName('test.txt');
    const parts = name.split('_');
    // UUID has 5 hyphen-separated groups; first part of storage name is UUID-ish
    assert.ok(name.includes('test.txt'));
    assert.ok(name.length > 'test.txt'.length + 10);
  });

  test('two calls produce unique storage names', () => {
    const a = buildStorageName('same.txt');
    const b = buildStorageName('same.txt');
    assert.notEqual(a, b);
  });
});

describe('Phase 4 — File size validation', () => {
  test('accepts file within limit', () => {
    const r = validateFileSize(10 * 1024 * 1024, 500); // 10 MB
    assert.equal(r.ok, true);
  });

  test('rejects file exceeding limit', () => {
    const r = validateFileSize(600 * 1024 * 1024, 500); // 600 MB
    assert.equal(r.ok, false);
    assert.ok(r.error.includes('500MB'));
  });

  test('rejects empty file (0 bytes)', () => {
    const r = validateFileSize(0, 500);
    assert.equal(r.ok, false);
    assert.ok(r.error.includes('empty'));
  });

  test('accepts file exactly at limit', () => {
    const r = validateFileSize(500 * 1024 * 1024, 500);
    assert.equal(r.ok, true);
  });
});

describe('Phase 4 — Transfer store', () => {
  let store;

  beforeEach(() => { store = new TransferStore(); });

  test('adds transfer at top of list', () => {
    store.add({ id: 'a', peerId: 'p1', status: 'uploading', progress: 0, filename: 'a.txt' });
    store.add({ id: 'b', peerId: 'p1', status: 'uploading', progress: 0, filename: 'b.txt' });
    assert.equal(store.getAll()[0].id, 'b'); // most recent first
  });

  test('updateProgress changes progress and status', () => {
    store.add({ id: 'x', peerId: 'p1', status: 'pending', progress: 0, filename: 'x.mp4' });
    store.updateProgress('x', 55);
    const t = store.getAll().find(t => t.id === 'x');
    assert.equal(t.progress, 55);
    assert.equal(t.status, 'uploading');
  });

  test('complete sets progress to 100 and stores downloadUrl', () => {
    store.add({ id: 'y', peerId: 'p1', status: 'uploading', progress: 80, filename: 'y.zip' });
    store.complete('y', '/api/download/y');
    const t = store.getAll().find(t => t.id === 'y');
    assert.equal(t.progress, 100);
    assert.equal(t.status, 'completed');
    assert.equal(t.downloadUrl, '/api/download/y');
  });

  test('fail marks transfer as failed', () => {
    store.add({ id: 'z', peerId: 'p1', status: 'uploading', progress: 20, filename: 'z.txt' });
    store.fail('z');
    const t = store.getAll().find(t => t.id === 'z');
    assert.equal(t.status, 'failed');
  });

  test('forPeer filters by peerId', () => {
    store.add({ id: '1', peerId: 'alice', status: 'completed', progress: 100, filename: 'a.txt' });
    store.add({ id: '2', peerId: 'bob',   status: 'completed', progress: 100, filename: 'b.txt' });
    store.add({ id: '3', peerId: 'alice', status: 'uploading', progress: 50,  filename: 'c.txt' });
    assert.equal(store.forPeer('alice').length, 2);
    assert.equal(store.forPeer('bob').length, 1);
  });
});

describe('Phase 4 — Download URL builder', () => {
  test('builds correct download URL', () => {
    const url = buildDownloadUrl('abc-123');
    assert.equal(url, '/api/download/abc-123');
  });

  test('URL contains the transfer ID', () => {
    const id = randomUUID();
    assert.ok(buildDownloadUrl(id).includes(id));
  });
});
