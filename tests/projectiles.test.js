import { describe, it, expect, beforeEach } from 'vitest';
import { updateProjectiles } from '../src/core/projectiles.js';

function makeState({ projectiles = [], fighters = [] } = {}) {
  return {
    projectiles,
    fighters,
    iceWalls: [],
    obstacles: [],
    particles: [],
    frameEvents: [],
    frame: 0,
    rng: Math.random,
    W: 1280,
    H: 800,
  };
}

function makeProjectile(overrides = {}) {
  return { x: 100, y: 100, vx: 0, vy: 0, life: 60, size: 5, damage: 10, owner: 'inferno', color: '#f00', piercing: false, ...overrides };
}

function makeFighter(overrides = {}) {
  return { id: 'frost', type: 'frost', x: 100, y: 100, size: 20, hp: 100, vx: 0, vy: 0, phased: false, ...overrides };
}

describe('updateProjectiles()', () => {
  it('reduces fighter hp when projectile is within collision range', () => {
    const fighter = makeFighter({ x: 100, y: 100 });
    const proj = makeProjectile({ x: 100, y: 100, owner: 'inferno', damage: 10 });
    const state = makeState({ projectiles: [proj], fighters: [fighter] });
    updateProjectiles(state);
    // damage has 80–120% variance, so hp drops between 88 and 92
    expect(fighter.hp).toBeGreaterThanOrEqual(88);
    expect(fighter.hp).toBeLessThanOrEqual(92);
  });

  it('sets fighter._lastHitBy to projectile owner on hit', () => {
    const fighter = makeFighter({ x: 100, y: 100 });
    const proj = makeProjectile({ x: 100, y: 100, owner: 'inferno' });
    const state = makeState({ projectiles: [proj], fighters: [fighter] });
    updateProjectiles(state);
    expect(fighter._lastHitBy).toBe('inferno');
  });

  it('removes projectile from array after hitting a fighter', () => {
    const fighter = makeFighter({ x: 100, y: 100 });
    const proj = makeProjectile({ x: 100, y: 100 });
    const state = makeState({ projectiles: [proj], fighters: [fighter] });
    updateProjectiles(state);
    expect(state.projectiles).toHaveLength(0);
  });

  it('does NOT reduce fighter hp when projectile is out of collision range', () => {
    const fighter = makeFighter({ x: 500, y: 500 });
    const proj = makeProjectile({ x: 100, y: 100 });
    const state = makeState({ projectiles: [proj], fighters: [fighter] });
    updateProjectiles(state);
    expect(fighter.hp).toBe(100);
  });
});
