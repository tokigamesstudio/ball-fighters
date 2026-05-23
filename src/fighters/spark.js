// ═══════════════════════════════════════════════════════════════════════════
// SPARK — Ricochet Bolt
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 84.63;
  return {
    id: 'spark', name: 'Spark', emoji: '⚡', type: 'spark',
    color: '#FFD700', colorAlt: '#FFF700', glow: 'rgba(255,215,0,0.6)',
    x: 120, y: 40, vx: 5, vy: 2,
    hp, maxHp: hp, size: 20, mass: 1, alive: true,
    _lastHitBy: null,
    _restitution: 0.95,
    _skillCooldown: 0,
    _erraticTimer: 0,
    _config: {
      skillCooldown: config.skillCooldown ?? 90.51,
      boltDamage: config.boltDamage ?? 24.00,
      boltSpeed: config.boltSpeed ?? 11,
      boltLife: config.boltLife ?? 100,
      directionChangeInterval: config.directionChangeInterval ?? 56.06,
      erraticImpulse: config.erraticImpulse ?? 2.0,
      speedCap: config.speedCap ?? 7,
      wallBounceBoost: config.wallBounceBoost ?? 1.02
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, spawnParticles, W, H, rng } = state;

  f._skillCooldown--;
  f._erraticTimer--;

  // Erratic movement: change direction randomly every 45f with upward bias
  if (f._erraticTimer <= 0) {
    f._erraticTimer = f._config.directionChangeInterval;
    const angle = rng() * Math.PI * 2;
    f.vx += Math.cos(angle) * f._config.erraticImpulse;
    f.vy += Math.sin(angle) * f._config.erraticImpulse;
    f.vy -= 4; // Strong upward component (increased from 3)
  }

  // Skill: fire electric bolt in current movement direction + upward kick
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    f.vy -= 3; // Upward kick (increased from 2)
    const speed = Math.sqrt(f.vx*f.vx + f.vy*f.vy);
    if (speed > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (f.vx/speed) * f._config.boltSpeed, 
        vy: (f.vy/speed) * f._config.boltSpeed,
        damage: f._config.boltDamage, 
        owner: 'spark', 
        color: '#FFD700',
        size: 7, life: f._config.boltLife, type: 'electric'
      });
      if (spawnParticles) spawnParticles(f.x, f.y, '#FFD700', 10, 3, 7);
    }
  }

  // Speed boost after wall bounce
  const pad = 50;
  let bounced = false;
  if (f.x <= pad + f.size || f.x >= W - pad - f.size) bounced = true;
  if (f.y <= pad + f.size || f.y >= H - pad - f.size) bounced = true;
  
  if (bounced) {
    f.vx *= f._config.wallBounceBoost;
    f.vy *= f._config.wallBounceBoost;
  }

  // Cap horizontal speed only
  const absVx = Math.abs(f.vx);
  if (absVx > f._config.speedCap) f.vx = (f.vx / absVx) * f._config.speedCap;
}
