import { describe, it, expect } from 'vitest';
import { createRNG, hashSeed } from '../src/core/rng.js';

describe('createRNG', () => {
  it('returns a function', () => {
    expect(typeof createRNG(1)).toBe('function');
  });

  it('produces identical sequence for the same seed', () => {
    const a = createRNG(42);
    const b = createRNG(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('hashSeed', () => {
  it('returns a positive integer for a non-empty string', () => {
    const result = hashSeed('abc');
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it('returns 1 for an empty string (fallback)', () => {
    expect(hashSeed('')).toBe(1);
  });
});
