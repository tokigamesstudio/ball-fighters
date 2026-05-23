import { describe, it, expect } from 'vitest';
import { applyGravity, applyBounds } from '../src/core/physics.js';

describe('applyGravity', () => {
  it('adds gravity to vy=0', () => {
    const f = { vx: 1, vy: 0 };
    applyGravity(f, 0.4);
    expect(f.vy).toBeCloseTo(0.4);
  });

  it('adds gravity to vy=2', () => {
    const f = { vx: 1, vy: 2 };
    applyGravity(f, 0.4);
    expect(f.vy).toBeCloseTo(2.4);
  });

  it('does not change vx', () => {
    const f = { vx: 3, vy: 0 };
    applyGravity(f, 0.4);
    expect(f.vx).toBe(3);
  });
});

describe('gravity + bounce integration', () => {
  // Simulate a ball with gravity and floor bounce using applyGravity + applyBounds
  // floor at H=600, pad=0, size=20 → floor contact at y=580
  const H = 600, W = 600, pad = 0, size = 20, gravity = 0.4, restitution = 0.8;

  function makeBall(y = 100) {
    return { x: 300, y, vx: 0, vy: 0, size };
  }

  function step(ball) {
    applyGravity(ball, gravity);
    ball.x += ball.vx;
    ball.y += ball.vy;
    applyBounds(ball, W, H, pad, restitution);
  }

  it('ball bounces (vy flips negative) after hitting floor', () => {
    const ball = makeBall(100);
    let bounced = false;
    for (let i = 0; i < 200; i++) {
      step(ball);
      if (ball.vy < 0) { bounced = true; break; }
    }
    expect(bounced).toBe(true);
  });

  it('ball reaches lower peak height after bounce (energy loss)', () => {
    const ball = makeBall(100);
    // Run until first bounce and then find the next peak
    let firstBounce = false;
    let peakAfterBounce = H;
    for (let i = 0; i < 400; i++) {
      const prevVy = ball.vy;
      step(ball);
      if (!firstBounce && ball.vy < 0 && prevVy >= 0) {
        firstBounce = true;
      }
      if (firstBounce && ball.vy >= 0 && prevVy < 0) {
        // Just passed peak (vy crossed zero going positive again)
        peakAfterBounce = ball.y;
        break;
      }
    }
    expect(firstBounce).toBe(true);
    // Peak after bounce should be higher y value (lower on screen) than start y=100
    expect(peakAfterBounce).toBeGreaterThan(100);
  });

  it('ball reaches floor within 60 frames from y=100, vy=0', () => {
    const ball = makeBall(100);
    const floorY = H - pad - size; // 580
    let reachedFloor = false;
    for (let i = 0; i < 60; i++) {
      step(ball);
      if (ball.y >= floorY) { reachedFloor = true; break; }
    }
    expect(reachedFloor).toBe(true);
  });
});
