/**
 * PHASE 5 TESTS — UI utility logic
 * Tests avatar colour generation, byte formatting, time formatting, initials.
 * Run: node --test tests/phase5.test.mjs
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─── Avatar colour logic (mirrors Avatar.tsx) ─────────────────────────────────
const COLOURS = [
  '#3d8ef0', '#2dd98a', '#f0a832', '#9d6ef0',
  '#f05252', '#0dd3d3', '#f07832', '#6ef09d',
];

function colourForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

function initials(name) {
  return name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

// ─── Byte formatter (mirrors TransferItem.tsx) ────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// ─── Message time formatter ───────────────────────────────────────────────────
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Progress clamp ───────────────────────────────────────────────────────────
function clampProgress(value) {
  return Math.min(100, Math.max(0, value));
}

describe('Phase 5 — Avatar colour generation', () => {
  test('returns a valid hex colour', () => {
    const colour = colourForName('Alice');
    assert.ok(COLOURS.includes(colour), `${colour} should be in palette`);
  });

  test('is deterministic — same name yields same colour', () => {
    assert.equal(colourForName('Bob'), colourForName('Bob'));
  });

  test('different names can produce different colours', () => {
    // With 8 colours and varied names, not all will be the same
    const colours = new Set(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank']
      .map(colourForName));
    assert.ok(colours.size > 1, 'should produce more than one colour across names');
  });

  test('empty string returns a colour without throwing', () => {
    assert.doesNotThrow(() => colourForName(''));
  });
});

describe('Phase 5 — Initials extraction', () => {
  test('single word gives one initial', () => {
    assert.equal(initials('Alice'), 'A');
  });

  test('two words give two initials', () => {
    assert.equal(initials('John Doe'), 'JD');
  });

  test('capitalises initials', () => {
    assert.equal(initials('john doe'), 'JD');
  });

  test('takes only first two words', () => {
    assert.equal(initials('John Michael Doe'), 'JM');
  });

  test('empty string returns empty string', () => {
    assert.equal(initials(''), '');
  });
});

describe('Phase 5 — Byte formatter', () => {
  test('formats bytes', () => {
    assert.equal(formatBytes(512), '512 B');
  });

  test('formats kilobytes', () => {
    assert.equal(formatBytes(1536), '1.5 KB');
  });

  test('formats megabytes', () => {
    assert.equal(formatBytes(10 * 1024 * 1024), '10.0 MB');
  });

  test('formats gigabytes', () => {
    assert.equal(formatBytes(2 * 1024 ** 3), '2.0 GB');
  });

  test('formats 0 bytes', () => {
    assert.equal(formatBytes(0), '0 B');
  });
});

describe('Phase 5 — Progress clamp', () => {
  test('clamps below 0 to 0', () => {
    assert.equal(clampProgress(-10), 0);
  });

  test('clamps above 100 to 100', () => {
    assert.equal(clampProgress(150), 100);
  });

  test('passes through valid values', () => {
    assert.equal(clampProgress(55), 55);
    assert.equal(clampProgress(0), 0);
    assert.equal(clampProgress(100), 100);
  });
});

describe('Phase 5 — Time formatter', () => {
  test('returns a non-empty string for valid ISO timestamp', () => {
    const result = formatTime(new Date().toISOString());
    assert.ok(result.length > 0);
  });

  test('includes colon (HH:MM format)', () => {
    const result = formatTime('2025-01-15T14:30:00.000Z');
    assert.ok(result.includes(':'));
  });
});
