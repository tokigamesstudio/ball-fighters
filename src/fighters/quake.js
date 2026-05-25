// ═══════════════════════════════════════════════════════════════════════════
// QUAKE — Shockwave (constant-speed: heavy, shockwave on proximity)
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 95;
  return {
    id: 'quake', name: 'Quake', emoji: '🪨', type: 'quake',
    color: '#8B4513', colorAlt: '#A0522D', glow: 'rgba(139,69,19,0.6)',
    x: W - 120, y: H * 0.6, vx: -3, vy: -4,
    hp, maxHp: hp, size: 20, mass: 1.2, alive: true,
    _lastHitBy: null,
    _restitution: 1.0,
    _skillCooldown: 0,
    _projectileTimer: 0,
    _config: {
      speed: config.speed ?? 3.5,
      skillCooldown: config.skillCooldown ?? 70,
      shockwaveRange: config.shockwaveRange ?? 150,
      shockwaveDamage: config.shockwaveDamage ?? 4,
      shockwaveRepulsion: config.shockwaveRepulsion ?? 2,
      projectileInterval: config.projectileInterval ?? 55,
      projectileDamage: config.projectileDamage ?? 3,
      projectileSpeed: config.projectileSpeed ?? 6,
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, particles, spawnParticles, nearestEnemyTo, frameEvents } = state;

  const target = nearestEnemyTo(f.x, f.y, 'quake', alive);
  if (!target) return;

  f._skillCooldown--;
  f._projectileTimer--;

  const dx = target.x - f.x, dy = target.y - f.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  // Skill: shockwave damages and pushes enemy (changes THEIR direction)
  if (f._skillCooldown <= 0 && dist < f._config.shockwaveRange) {
    f._skillCooldown = f._config.skillCooldown;
    if (!target.phasing) {
      target.hp -= f._config.shockwaveDamage;
      target._lastHitBy = 'quake';
    }
    // Push enemy away (their enforceConstantSpeed will normalize after)
    if (dist > 0) {
      target.vx += (dx/dist) * f._config.shockwaveRepulsion;
      target.vy += (dy/dist) * f._config.shockwaveRepulsion;
    }
    if (particles) particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 30, maxLife: 30, color: '#8B4513', size: 40, type: 'ring' });
    if (spawnParticles) spawnParticles(f.x, f.y, '#8B4513', 20, 4, 8);
    if (frameEvents) frameEvents.push({ type: 'quakeShockwave', x: f.x, y: f.y, range: f._config.shockwaveRange });
  }

  // Projectile: rock toward enemy
  if (f._projectileTimer <= 0) {
    f._projectileTimer = f._config.projectileInterval;
    if (dist > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (dx/dist) * f._config.projectileSpeed, vy: (dy/dist) * f._config.projectileSpeed,
        damage: f._config.projectileDamage, owner: 'quake', color: '#8B4513',
        size: 10, life: 150, type: 'rock'
      });
    }
  }
}
