/**
 * PHASE 1 TESTS — Environment config + utility logic
 * Uses only Node built-ins, no npm needed.
 * Run: node --test tests/phase1.test.mjs
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─── Replicate the env schema logic without zod ───────────────────────────────
function parseEnv(raw) {
  const errors = [];

  if (!raw.DATABASE_URL) errors.push('DATABASE_URL required');
  else {
    try { new URL(raw.DATABASE_URL); }
    catch { errors.push('DATABASE_URL must be a valid URL'); }
  }

  const port = Number(raw.PORT ?? 3001);
  if (isNaN(port) || port < 1 || port > 65535) errors.push('PORT must be a valid port number');

  const maxMB = Number(raw.MAX_FILE_SIZE_MB ?? 500);
  if (isNaN(maxMB) || maxMB <= 0) errors.push('MAX_FILE_SIZE_MB must be positive');

  const nodeEnv = raw.NODE_ENV ?? 'development';
  if (!['development','production','test'].includes(nodeEnv))
    errors.push('NODE_ENV must be development | production | test');

  if (errors.length) return { success: false, errors };
  return {
    success: true,
    data: {
      DATABASE_URL: raw.DATABASE_URL,
      PORT: port,
      UPLOAD_DIR: raw.UPLOAD_DIR ?? './uploads',
      MAX_FILE_SIZE_MB: maxMB,
      CORS_ORIGIN: raw.CORS_ORIGIN ?? 'http://localhost:5173',
      NODE_ENV: nodeEnv,
    }
  };
}

describe('Phase 1 — Environment validation', () => {
  test('rejects missing DATABASE_URL', () => {
    const result = parseEnv({ PORT: '3001' });
    assert.equal(result.success, false);
    assert.ok(result.errors.some(e => e.includes('DATABASE_URL')));
  });

  test('rejects invalid DATABASE_URL (not a URL)', () => {
    const result = parseEnv({ DATABASE_URL: 'not-a-url' });
    assert.equal(result.success, false);
    assert.ok(result.errors.some(e => e.includes('DATABASE_URL')));
  });

  test('accepts valid postgres URL', () => {
    const result = parseEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.PORT, 3001);
    assert.equal(result.data.MAX_FILE_SIZE_MB, 500);
  });

  test('coerces PORT from string to number', () => {
    const result = parseEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      PORT: '4000',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.PORT, 4000);
    assert.equal(typeof result.data.PORT, 'number');
  });

  test('rejects invalid NODE_ENV', () => {
    const result = parseEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      NODE_ENV: 'staging',
    });
    assert.equal(result.success, false);
    assert.ok(result.errors.some(e => e.includes('NODE_ENV')));
  });

  test('uses defaults for optional fields', () => {
    const result = parseEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.UPLOAD_DIR, './uploads');
    assert.equal(result.data.CORS_ORIGIN, 'http://localhost:5173');
    assert.equal(result.data.NODE_ENV, 'development');
  });
});
