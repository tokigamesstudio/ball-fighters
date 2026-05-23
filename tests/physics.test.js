import { describe, it, expect } from 'vitest';
import { applyBounds, resolveObstacle } from '../src/core/physics.js';

describe('applyBounds', () => {
  const W = 1280, H = 800, pad = 50;

  it('clamps fighter.x to [pad+size, W-pad-size]', () => {
    const f = { x: 0, y: 400, vx: -3, vy: 0, size: 24 };
    applyBounds(f, W, H, pad);
    expect(f.x).toBe(pad + f.size);
  });

  it('clamps fighter.y to [pad+size, H-pad-size]', () => {
    const f = { x: 640, y: H + 100, vx: 0, vy: 3, size: 24 };
    applyBounds(f, W, H, pad);
    expect(f.y).toBe(H - pad - f.size);
  });

  it('bounces vx when clamped on x-axis', () => {
    const f = { x: 0, y: 400, vx: -3, vy: 0, size: 24 };
    applyBounds(f, W, H, pad);
    expect(f.vx).toBeCloseTo(-3 * -0.98);
  });

  it('bounces vy when clamped on y-axis', () => {
    const f = { x: 640, y: H + 100, vx: 0, vy: 3, size: 24 };
    applyBounds(f, W, H, pad);
    expect(f.vy).toBeCloseTo(3 * -0.85); // Floor uses 0.85 restitution
  });

  it('does not clamp fighter already within bounds', () => {
    const f = { x: 640, y: 400, vx: 1, vy: 1, size: 24 };
    applyBounds(f, W, H, pad);
    expect(f.x).toBe(640);
    expect(f.y).toBe(400);
  });
});

describe('resolveObstacle', () => {
  it('pushes fighter outside obstacle radius', () => {
    const obs = { x: 100, y: 100, radius: 30 };
    const f = { x: 110, y: 100, vx: 0, vy: 0, size: 24 };
    resolveObstacle(f, obs);
    const dx = f.x - obs.x, dy = f.y - obs.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThanOrEqual(obs.radius + f.size);
  });

  it('does not move fighter already outside obstacle', () => {
    const obs = { x: 100, y: 100, radius: 30 };
    const f = { x: 300, y: 300, vx: 0, vy: 0, size: 24 };
    resolveObstacle(f, obs);
    expect(f.x).toBe(300);
    expect(f.y).toBe(300);
  });
});
