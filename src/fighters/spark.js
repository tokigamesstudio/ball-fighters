// ═══════════════════════════════════════════════════════════════════════════
// SPARK — Ricochet Bolt (constant-speed: fast, fires in movement direction)
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 52;
  return {
    id: 'spark', name: 'Spark', emoji: '⚡', type: 'spark',
    color: '#FFD700', colorAlt: '#FFF700', glow: 'rgba(255,215,0,0.6)',
    x: 120, y: H * 0.3, vx: 4, vy: -4,
    hp, maxHp: hp, size: 20, mass: 0.8, alive: true,
    _lastHitBy: null,
    _restitution: 1.0,
    _skillCooldown: 0,
    _config: {
      speed: config.speed ?? 6,
      skillCooldown: config.skillCooldown ?? 50,
      boltDamage: config.boltDamage ?? 24,
      boltSpeed: config.boltSpeed ?? 10,
      boltLife: config.boltLife ?? 80,
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, spawnParticles } = state;

  f._skillCooldown--;

  // Skill: fire electric bolt in current movement direction
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    const speed = Math.sqrt(f.vx*f.vx + f.vy*f.vy);
    if (speed > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (f.vx/speed) * f._config.boltSpeed, vy: (f.vy/speed) * f._config.boltSpeed,
        damage: f._config.boltDamage, owner: 'spark', color: '#FFD700',
        size: 7, life: f._config.boltLife, type: 'electric'
      });
      if (spawnParticles) spawnParticles(f.x, f.y, '#FFD700', 8, 3, 6);
    }
  }
}
