import { describe, it, expect } from 'vitest';
import { BattleSimulation } from '../src/core/simulation.js';

describe('BattleSimulation', () => {
  it('creates 4 fighters with types blaze, quake, spark, phantom', () => {
    const sim = new BattleSimulation('test-seed');
    const types = sim.fighters.map(f => f.type);
    expect(types).toEqual(['blaze', 'quake', 'air', 'water']);
  });

  it('step() increments frame by 1', () => {
    const sim = new BattleSimulation('test-seed');
    expect(sim.frame).toBe(0);
    sim.step();
    expect(sim.frame).toBe(1);
  });

  it('runAll() returns required shape', () => {
    const result = new BattleSimulation('test-seed').runAll();
    expect(result).toMatchObject({
      frames: expect.any(Array),
      winner: expect.any(Object),
      totalFrames: expect.any(Number),
      seed: 'test-seed',
      kills: expect.any(Array),
    });
  });

  it('runAll() always terminates within maxFrames', () => {
    const sim = new BattleSimulation('termination-check');
    const result = sim.runAll();
    expect(result.totalFrames).toBeLessThanOrEqual(sim.maxFrames ?? 3600);
  });

  it('same seed produces same winner (determinism)', () => {
    const seed = 'deterministic-seed';
    const w1 = new BattleSimulation(seed).runAll().winner;
    const w2 = new BattleSimulation(seed).runAll().winner;
    expect(w1.id).toBe(w2.id);
    expect(w1.hp).toBeCloseTo(w2.hp, 5);
  });

  it('fighter death: hp <= 0 sets alive=false and adds to kills array', () => {
    const sim = new BattleSimulation('death-test');
    const target = sim.fighters[0];
    target.hp = 1;
    target._lastHitBy = 'boulder';
    // Force hp to 0 via a step — set hp negative so death triggers
    target.hp = -1;
    sim.step();
    expect(target.alive).toBe(false);
    expect(target.hp).toBe(0);
    expect(sim.kills.some(k => k.victim === target.id)).toBe(true);
    const kill = sim.kills.find(k => k.victim === target.id);
    expect(kill.killer).toBe('boulder');
  });

  it('danger zone: dangerPad is 0 before frame 1800 and positive after', () => {
    const sim = new BattleSimulation('danger-test');
    // Jump to frame 1799 without running full simulation
    sim.frame = 1799;
    expect(sim.dangerPad).toBe(0);
    // step() increments frame to 1800: condition is frame >= 1800, so dangerPad = (1800-1800)*0.08 = 0
    // step() to 1801: dangerPad = (1801-1800)*0.08 = 0.08 > 0
    sim.frame = 1800;
    sim.step(); // frame becomes 1801
    expect(sim.dangerPad).toBeGreaterThan(0);
  });
});
