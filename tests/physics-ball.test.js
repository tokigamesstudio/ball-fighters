import { describe, it, expect } from 'vitest';
import { applyBounds, resolveBallCollision, applyFriction } from '../src/core/physics.js';

const W = 1280, H = 800, pad = 50;

describe('applyBounds with restitution', () => {
  it('right wall: vx becomes -vx * restitution, x clamped', () => {
    const r = 0.7;
    const f = { x: W - pad - 20, y: 400, vx: 5, vy: 0, size: 20 };
    applyBounds(f, W, H, pad, r);
    expect(f.x).toBe(W - pad - f.size);
    expect(f.vx).toBeCloseTo(-5 * r);
  });

  it('left wall: vx becomes -vx * restitution (positive), x clamped', () => {
    const r = 0.7;
    const f = { x: pad + 20, y: 400, vx: -5, vy: 0, size: 20 };
    applyBounds(f, W, H, pad, r);
    expect(f.x).toBe(pad + f.size);
    expect(f.vx).toBeCloseTo(5 * r);
  });

  it('not at wall: unchanged', () => {
    const f = { x: 640, y: 400, vx: 5, vy: 0, size: 20 };
    applyBounds(f, W, H, pad, 0.7);
    expect(f.vx).toBe(5);
    expect(f.x).toBe(640);
  });
});

describe('resolveBallCollision', () => {
  it('equal-mass balls moving toward each other exchange velocities along normal', () => {
    const a = { x: 0, y: 0, vx: 2, vy: 0, size: 10, mass: 1 };
    const b = { x: 15, y: 0, vx: -2, vy: 0, size: 10, mass: 1 };
    resolveBallCollision(a, b);
    expect(a.vx).toBeCloseTo(-2);
    expect(b.vx).toBeCloseTo(2);
    const dx = b.x - a.x;
    expect(Math.abs(dx)).toBeGreaterThanOrEqual(a.size + b.size);
  });

  it('heavy ball (mass 2.5) hits stationary light ball (mass 1): light gets more velocity', () => {
    const a = { x: 0, y: 0, vx: 4, vy: 0, size: 10, mass: 2.5 };
    const b = { x: 15, y: 0, vx: 0, vy: 0, size: 10, mass: 1 };
    resolveBallCollision(a, b);
    expect(b.vx).toBeGreaterThan(Math.abs(a.vx - 4));
  });

  it('already separating: returns false, no velocity change', () => {
    const a = { x: 0, y: 0, vx: -2, vy: 0, size: 10, mass: 1 };
    const b = { x: 15, y: 0, vx: 2, vy: 0, size: 10, mass: 1 };
    const result = resolveBallCollision(a, b);
    expect(result).toBe(false);
    expect(a.vx).toBe(-2);
    expect(b.vx).toBe(2);
  });

  it('returns true when collision occurred', () => {
    const a = { x: 0, y: 0, vx: 2, vy: 0, size: 10, mass: 1 };
    const b = { x: 15, y: 0, vx: -2, vy: 0, size: 10, mass: 1 };
    expect(resolveBallCollision(a, b)).toBe(true);
  });
});

describe('applyFriction', () => {
  it('applies default friction of 0.995 to vx only', () => {
    const f = { vx: 10, vy: -6 };
    applyFriction(f);
    expect(f.vx).toBeCloseTo(10 * 0.995);
    expect(f.vy).toBe(-6); // vy unchanged
  });
});
