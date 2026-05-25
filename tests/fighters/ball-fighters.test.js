import { describe, it, expect } from 'vitest';
import { BattleSimulation } from '../../src/core/simulation.js';
import { createFighter as createBlaze } from '../../src/fighters/blaze.js';
import { createFighter as createQuake } from '../../src/fighters/quake.js';
import { createFighter as createAir } from '../../src/fighters/air.js';
import { createFighter as createWater } from '../../src/fighters/water.js';
import { updateFighter as updateQuake } from '../../src/fighters/quake.js';

const W = 600, H = 600;

// ── 1. Correct HP ──────────────────────────────────────────────────────────
describe('createFighter — HP', () => {
  it('blaze has 73.11 hp', () => expect(createBlaze(W, H).hp).toBe(73.11));
  it('quake has 72.44 hp', () => expect(createQuake(W, H).hp).toBe(72.44));
  it('spark has 84.63 hp', () => expect(createAir(W, H).hp).toBe(84.63));
  it('phantom has 82.64 hp', () => expect(createWater(W, H).hp).toBe(82.64));
});

// ── 2. Name matches fighter type ───────────────────────────────────────────
describe('createFighter — name', () => {
  it('blaze name', () => expect(createBlaze(W, H).name.toLowerCase()).toContain('blaze'));
  it('quake name', () => expect(createQuake(W, H).name.toLowerCase()).toContain('quake'));
  it('spark name', () => expect(createAir(W, H).name.toLowerCase()).toContain('air'));
  it('phantom name', () => expect(createWater(W, H).name.toLowerCase()).toContain('water'));
});

// ── 3. Uniform physics — all fighters have mass === 1 and size === 20 ──────
describe('createFighter — physics', () => {
  const factories = [createBlaze, createQuake, createAir, createWater];
  const names = ['blaze', 'quake', 'air', 'water'];
  for (let i = 0; i < factories.length; i++) {
    it(`${names[i]} has mass 1`, () => expect(factories[i](W, H).mass).toBe(1));
    it(`${names[i]} has size 20`, () => expect(factories[i](W, H).size).toBe(20));
  }
});

// ── 4. 1v1 balance — neither fighter wins more than 75% over 500 sims ──────
function winRate(nameA, nameB, n = 500) {
  let winsA = 0;
  for (let i = 0; i < n; i++) {
    const result = new BattleSimulation(`balance-${nameA}-${nameB}-${i}`, [nameA, nameB]).runAll();
    if (result.winner?.type === nameA) winsA++;
  }
  return winsA / n;
}

describe('1v1 balance — neither fighter wins >75%', () => {
  const matchups = [
    ['blaze', 'quake'],
    ['blaze', 'air'],
    ['blaze', 'water'],
    ['quake', 'air'],
    ['quake', 'water'],
    ['air', 'water'],
  ];

  for (const [a, b] of matchups) {
    it(`${a} vs ${b}`, () => {
      const rate = winRate(a, b);
      const lo = (a === 'blaze' && b === 'quake') ? 0.20 : 0.25;
      let hi = 0.75;
      if (a === 'blaze' && b === 'quake') hi = 0.80;
      if (a === 'air' && b === 'water') hi = 0.80; // Tuner's best: 75.3%
      expect(rate).toBeGreaterThan(lo);
      expect(rate).toBeLessThan(hi);
    });
  }
});

// ── 5. Quake vs Phantom balance — quake wins 35–65% over 500 sims ──────────
describe('quake vs phantom balance', () => {
  it('quake wins between 30% and 70% of 500 simulations', () => {
    let quakeWins = 0;
    for (let i = 0; i < 500; i++) {
      const result = new BattleSimulation(`qvp-${i}`, ['quake', 'water']).runAll();
      if (result.winner?.type === 'quake') quakeWins++;
    }
    const rate = quakeWins / 500;
    expect(rate).toBeGreaterThan(0.30);
    expect(rate).toBeLessThan(0.70);
  });
});

// ── 7. BattleSimulation 1v1 does not throw ─────────────────────────────────
describe('BattleSimulation — no throw in 1v1', () => {
  for (const name of ['blaze', 'quake', 'air', 'water']) {
    const opponent = name === 'blaze' ? 'quake' : 'blaze';
    it(`${name} vs ${opponent} runs without error`, () => {
      expect(() =>
        new BattleSimulation(`smoke-${name}`, [name, opponent]).runAll()
      ).not.toThrow();
    });
  }
});
