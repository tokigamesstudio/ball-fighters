import { describe, it, expect } from 'vitest';
import { createFighter } from '../../src/fighters/water.js';
import { updateFighter } from '../../src/fighters/water.js';

const W = 600, H = 600;

function makeState(enemy) {
  let seed = 0;
  return {
    W, H,
    projectiles: [],
    particles: [],
    spawnParticles: () => {},
    nearestEnemyTo: () => enemy,
    rng: () => { seed = (seed * 2654435761) >>> 0; return (seed >>> 0) / 4294967296; }
  };
}

function triggerSkill(water, enemy) {
  water._skillCooldown = 0;
  const alive = [water, enemy].filter(f => f.alive);
  updateFighter(water, alive, makeState(enemy));
}

describe('water teleport skill', () => {
  it('moves position by more than 50px', () => {
    const p = createFighter(W, H);
    const enemy = { x: 300, y: 300, vx: 0, vy: 0, type: 'blaze', alive: true };
    const { x: x0, y: y0 } = p;
    triggerSkill(p, enemy);
    const dist = Math.hypot(p.x - x0, p.y - y0);
    expect(dist).toBeGreaterThan(50);
  });

  it('resets velocity to a moderate value after teleport', () => {
    const p = createFighter(W, H);
    p.vx = 50; p.vy = -50; // extreme momentum
    const enemy = { x: 300, y: 300, vx: 0, vy: 0, type: 'blaze', alive: true };
    triggerSkill(p, enemy);
    const speed = Math.hypot(p.vx, p.vy);
    expect(speed).toBeLessThan(15);
  });

  it('lands within arena bounds', () => {
    const p = createFighter(W, H);
    const enemy = { x: 300, y: 300, vx: 0, vy: 0, type: 'blaze', alive: true };
    triggerSkill(p, enemy);
    expect(p.x).toBeGreaterThanOrEqual(p.size);
    expect(p.x).toBeLessThanOrEqual(W - p.size);
    expect(p.y).toBeGreaterThanOrEqual(p.size);
    expect(p.y).toBeLessThanOrEqual(H - p.size);
  });

  it('does not land on top of the enemy (distance > 60px)', () => {
    const p = createFighter(W, H);
    const enemy = { x: 300, y: 300, vx: 0, vy: 0, type: 'blaze', alive: true };
    triggerSkill(p, enemy);
    const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    expect(dist).toBeGreaterThan(60);
  });
});
