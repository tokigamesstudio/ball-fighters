// ═══════════════════════════════════════════════════════════════════════════
// WATER — Tidal Ghost (constant-speed: phases to avoid damage, fires bolts)
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 75;
  return {
    id: 'water', name: 'Water', emoji: '🌊', type: 'water',
    color: '#1E90FF', colorAlt: '#4169E1', glow: 'rgba(30,144,255,0.6)',
    x: W - 120, y: H * 0.35, vx: -3, vy: 4,
    hp, maxHp: hp, size: 20, mass: 0.9, alive: true,
    _lastHitBy: null,
    _restitution: 1.0,
    _phaseTimer: 0,
    _phaseCooldown: 0,
    _projectileTimer: 0,
    phasing: false,
    _config: {
      speed: config.speed ?? 5,
      phaseDuration: config.phaseDuration ?? 30,
      phaseCooldown: config.phaseCooldown ?? 200,
      boltDamage: config.boltDamage ?? 13,
      boltSpeed: config.boltSpeed ?? 7,
      projectileInterval: config.projectileInterval ?? 80,
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, particles, spawnParticles, nearestEnemyTo } = state;

  const target = nearestEnemyTo(f.x, f.y, 'water', alive);
  if (!target) return;

  f._projectileTimer--;
  f._phaseCooldown--;

  // Phase: become invulnerable periodically
  if (f._phaseTimer > 0) {
    f._phaseTimer--;
    f.phasing = true;
    if (f._phaseTimer <= 0) {
      f.phasing = false;
      f._phaseCooldown = f._config.phaseCooldown;
    }
  } else if (f._phaseCooldown <= 0) {
    f._phaseTimer = f._config.phaseDuration;
    f.phasing = true;
    if (particles) particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 25, maxLife: 25, color: '#1E90FF', size: 20, type: 'ring' });
  }

  // Fire bolt toward enemy
  const dx = target.x - f.x, dy = target.y - f.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (f._projectileTimer <= 0 && dist > 0) {
    f._projectileTimer = f._config.projectileInterval;
    projectiles.push({
      x: f.x, y: f.y,
      vx: (dx/dist) * f._config.boltSpeed, vy: (dy/dist) * f._config.boltSpeed,
      damage: f._config.boltDamage, owner: 'water', color: '#1E90FF',
      size: 7, life: 120, type: 'water_bolt'
    });
    if (spawnParticles) spawnParticles(f.x, f.y, '#1E90FF', 5, 2, 4);
  }
}
