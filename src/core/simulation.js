// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
import { createRNG, hashSeed } from './rng.js';
import { applyBounds, resolveBallCollision, applyFriction, applyGravity, capSpeed, enforceConstantSpeed } from './physics.js';
import { updateProjectiles } from './projectiles.js';
import * as Blaze from '../fighters/blaze.js';
import * as Quake from '../fighters/quake.js';
import * as Spark from '../fighters/spark.js';
import * as Phantom from '../fighters/phantom.js';

export class BattleSimulation {
  constructor(seed, fighterNames, fighterConfigs = {}) {
    this.seed = seed;
    this.rng = createRNG(hashSeed(seed));
    this.frame = 0;
    this.maxFrames = 3600; // 60s
    this.finished = false;
    this.winner = null;
    this.W = 600;
    this.H = 600;
    this.kills = [];

    // Danger zone shrinks arena over time
    this.dangerZoneStart = 1800; // 30s
    this.dangerPad = 0;

    // Fire trails left by Blaze
    this.fireTrails = []; // {x, y, life, maxLife}

    // Projectiles and particles
    this.projectiles = [];
    this.particles = [];
    this.frameEvents = [];
    this.flashEffect = 0;

    // Initialize fighters with COMPLETELY different behaviors
    const allFighters = [
      { name: 'blaze', create: (cfg) => Blaze.createFighter(this.W, this.H, cfg) },
      { name: 'quake', create: (cfg) => Quake.createFighter(this.W, this.H, cfg) },
      { name: 'spark', create: (cfg) => Spark.createFighter(this.W, this.H, cfg) },
      { name: 'phantom', create: (cfg) => Phantom.createFighter(this.W, this.H, cfg) }
    ];
    const defaultFighters = ['blaze', 'quake', 'spark', 'phantom'];
    this.fighters = fighterNames
      ? allFighters.filter(f => fighterNames.includes(f.name)).map(f => f.create(fighterConfigs[f.name] || {}))
      : allFighters.filter(f => defaultFighters.includes(f.name)).map(f => f.create(fighterConfigs[f.name] || {}));

    // Randomize starting positions and directions
    const pad = 80;
    for (const f of this.fighters) {
      f.x = pad + this.rng() * (this.W - pad * 2);
      f.y = pad + this.rng() * (this.H - pad * 2);
      const angle = this.rng() * Math.PI * 2;
      const speed = f._config?.speed ?? 5;
      f.vx = Math.cos(angle) * speed;
      f.vy = Math.sin(angle) * speed;
    }
  }

  step() {
    this.frame++;
    this.frameEvents = [];
    const alive = this.fighters.filter(f => f.alive);

    if (alive.length <= 1) {
      if (alive.length === 1) {
        this.winner = alive[0];
      } else {
        // Both died simultaneously — award win to whoever had more HP (least negative)
        this.winner = this.fighters.slice().sort((a, b) => b.hp - a.hp)[0];
      }
      this.finished = true;
      return;
    }

    // Danger zone
    if (this.frame >= this.dangerZoneStart) {
      this.dangerPad = Math.min(200, (this.frame - this.dangerZoneStart) * 0.08);
    }

    // Flash decay
    if (this.flashEffect > 0) this.flashEffect *= 0.85;

    // Update fire trails
    for (let i = this.fireTrails.length - 1; i >= 0; i--) {
      this.fireTrails[i].life--;
      if (this.fireTrails[i].life <= 0) this.fireTrails.splice(i, 1);
    }

    // Fire trail damage to non-blaze fighters
    for (const f of alive) {
      if (f.type === 'blaze' || f.phasing) continue;
      for (const trail of this.fireTrails) {
        const dx = f.x - trail.x, dy = f.y - trail.y;
        const trailRadius = trail.radius || 30;
        if (dx*dx + dy*dy < (f.size + trailRadius)**2) {
          if (this.frame % 6 === 0) {
            const variance = 0.7 + this.rng() * 0.6;
            const actualDamage = (trail.damage || 2) * variance;
            f.hp -= actualDamage;
            f._lastHitBy = trail.owner || 'blaze';
            this.frameEvents.push({ type: 'damage', x: f.x, y: f.y - f.size - 5, amount: Math.round(actualDamage), color: '#ff6600' });
            this.spawnParticles(f.x, f.y, '#ff6600', 3, 2, 2);
          }
          break;
        }
      }
    }

    // 1. (no friction/cap — constant speed enforced after physics)

    // 2. Update each fighter with UNIQUE behavior
    for (const f of alive) {
      const state = {
        rng: this.rng,
        frame: this.frame,
        projectiles: this.projectiles,
        particles: this.particles,
        fireTrails: this.fireTrails,
        frameEvents: this.frameEvents,
        W: this.W,
        H: this.H,
        flashEffect: this.flashEffect,
        spawnParticles: this.spawnParticles.bind(this),
        nearestEnemyTo: this.nearestEnemyTo.bind(this)
      };

      switch (f.type) {
        case 'blaze': Blaze.updateFighter(f, alive, state); break;
        case 'quake': Quake.updateFighter(f, alive, state); break;
        case 'spark': Spark.updateFighter(f, alive, state); break;
        case 'phantom': Phantom.updateFighter(f, alive, state); break;
      }

      // Sync flashEffect back
      this.flashEffect = state.flashEffect;

      // Apply velocity
      f.x += f.vx;
      f.y += f.vy;
    }

    // 3. Apply bounds with restitution
    const pad = 50 + this.dangerPad;
    for (const f of alive) {
      applyBounds(f, this.W, this.H, pad, this.rng);
    }

    // 4. Ball collision between fighters with damage
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i], b = alive[j];
        
        // Calculate relative speed BEFORE collision
        const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
        const relSpeed = Math.sqrt(dvx*dvx + dvy*dvy);
        
        // Resolve collision
        const collided = resolveBallCollision(a, b);
        
        // Apply collision damage if collision occurred (equal for all fighters)
        if (collided) {
          const damage = relSpeed * 0.7;
          if (damage > 0) {
            const variance = 0.8 + this.rng() * 0.4; // 80-120% damage
            const actualDamage = damage * variance;
            if (!a.phasing) { a.hp -= actualDamage; a._lastHitBy = b.id; }
            if (!b.phasing) { b.hp -= actualDamage; b._lastHitBy = a.id; }
            const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
            this.frameEvents.push({ type: 'damage', x: a.x, y: a.y - a.size - 5, amount: Math.round(actualDamage), color: '#fff' });
            this.frameEvents.push({ type: 'damage', x: b.x, y: b.y - b.size - 5, amount: Math.round(actualDamage), color: '#fff' });
            this.spawnParticles(mx, my, '#fff', 5, 2, 4);
          }
        }
      }
    }

    // Danger zone damage
    if (this.dangerPad > 0) {
      for (const f of alive) {
        const edgeDist = Math.min(f.x - 50, f.y - 50, this.W - 50 - f.x, this.H - 50 - f.y);
        if (edgeDist < this.dangerPad && this.frame % 15 === 0) {
          f.hp -= 2;
          this.spawnParticles(f.x, f.y, '#ff2200', 3, 2, 2);
        }
      }
    }

    // Check for death after collisions
    for (const f of alive) {
      enforceConstantSpeed(f);
      if (f.hp <= 0) {
        f.hp = 0;
        f.alive = false;
        this.kills.push({ frame: this.frame, victim: f.id, killer: f._lastHitBy || 'unknown' });
        this.frameEvents.push({ type: 'death', id: f.id, x: f.x, y: f.y, color: f.color });
        this.spawnParticles(f.x, f.y, f.color, 40, 6, 10);
        this.spawnParticles(f.x, f.y, '#fff', 15, 3, 7);
        this.particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 35, maxLife: 35, color: f.color, size: f.size, type: 'ring' });
        this.flashEffect = 0.5;
        this.frameEvents.push({ type: 'screenShake', intensity: 18 });
      }
    }

    // Update projectiles
    updateProjectiles({
      projectiles: this.projectiles,
      fighters: alive,
      particles: this.particles,
      frameEvents: this.frameEvents,
      frame: this.frame,
      rng: this.rng,
      W: this.W,
      H: this.H
    });

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.type === 'ring') { /* stays in place */ }
      else { p.vx *= 0.94; p.vy *= 0.94; p.vy += 0.03; }
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  nearestEnemyTo(x, y, excludeId, alive) {
    let nearest = null, minDist = Infinity;
    for (const f of alive) {
      if (f.id === excludeId) continue;
      const d = (f.x-x)**2 + (f.y-y)**2;
      if (d < minDist) { minDist = d; nearest = f; }
    }
    return nearest;
  }

  spawnParticles(x, y, color, count, size, speed) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2;
      const spd = (0.3 + this.rng()) * speed;
      this.particles.push({
        x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        life: 18 + this.rng()*20, maxLife: 38, color, size: (0.4+this.rng())*size, type: 'spark'
      });
    }
  }

  captureFrame() {
    return {
      frame: this.frame,
      fighters: this.fighters.map(f => ({
        ...f, trail: undefined, chargeTarget: undefined
      })),
      projectiles: this.projectiles.map(p => ({ x:p.x, y:p.y, vx:p.vx, vy:p.vy, size:p.size, color:p.color, type:p.type, life:p.life })),
      particles: this.particles.map(p => ({ x:p.x, y:p.y, size:p.size, color:p.color, life:p.life, maxLife:p.maxLife, type:p.type })),
      fireTrails: this.fireTrails.map(t => ({ x:t.x, y:t.y, life:t.life, maxLife:t.maxLife })),
      events: [...this.frameEvents],
      dangerPad: this.dangerPad,
      flash: this.flashEffect
    };
  }

  runAll() {
    const frames = [];
    while (!this.finished && this.frame < this.maxFrames) {
      this.step();
      frames.push(this.captureFrame());
    }
    if (!this.winner) {
      const alive = this.fighters.filter(f => f.alive);
      alive.sort((a, b) => b.hp - a.hp);
      this.winner = alive[0];
      this.finished = true;
      frames.push(this.captureFrame());
    }
    return { frames, winner: this.winner, totalFrames: this.frame, seed: this.seed, kills: this.kills };
  }
}
