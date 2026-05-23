// ═══════════════════════════════════════════════════════════════════════════
// BLAZE — Fire Trail
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 73.11;
  return {
    id: 'blaze', name: 'Blaze', emoji: '🔥', type: 'blaze',
    color: '#ff4400', colorAlt: '#ff8800', glow: 'rgba(255,68,0,0.6)',
    x: 120, y: 40, vx: 5, vy: 2,
    hp, maxHp: hp, size: 20, mass: 1, alive: true,
    _lastHitBy: null,
    _restitution: 0.95,
    _skillCooldown: 0,
    _passiveTrailTimer: 0,
    _homingTimer: 0,
    _config: {
      skillCooldown: config.skillCooldown ?? 150.00,
      impulsePower: config.impulsePower ?? 2.92,
      fireTrailDamage: config.fireTrailDamage ?? 3.80,
      fireTrailLife: config.fireTrailLife ?? 180,
      fireTrailRadius: config.fireTrailRadius ?? 32,
      passiveTrailInterval: config.passiveTrailInterval ?? 40,
      passiveSpeedThreshold: config.passiveSpeedThreshold ?? 2.5,
      homingInterval: config.homingInterval ?? 30,
      homingForce: config.homingForce ?? 0.4,
      speedCap: config.speedCap ?? 6
    }
  };
}

export function updateFighter(f, alive, state) {
  const { fireTrails, spawnParticles, nearestEnemyTo } = state;

  const target = nearestEnemyTo(f.x, f.y, 'blaze', alive);
  if (!target) return;

  f._skillCooldown--;
  f._passiveTrailTimer--;
  f._homingTimer--;

  // Periodic upward impulse every 60f to stay airborne
  if (!f._airborneTimer) f._airborneTimer = 60;
  f._airborneTimer--;
  if (f._airborneTimer <= 0) {
    f._airborneTimer = 60;
    f.vy -= 3; // Increased from 2
  }

  // Gentle homing every 30f
  if (f._homingTimer <= 0) {
    f._homingTimer = f._config.homingInterval;
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      f.vx += (dx/dist) * f._config.homingForce;
      f.vy += (dy/dist) * f._config.homingForce;
    }
  }

  // Skill: impulse toward enemy + drop fire trail + upward launch
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      f.vx += (dx/dist) * f._config.impulsePower;
      f.vy += (dy/dist) * f._config.impulsePower;
    }
    f.vy -= 5; // Upward launch (increased from 4)
    fireTrails.push({ 
      x: f.x, y: f.y, 
      life: f._config.fireTrailLife, 
      maxLife: f._config.fireTrailLife, 
      owner: 'blaze', 
      damage: f._config.fireTrailDamage,
      radius: 35
    });
    if (spawnParticles) spawnParticles(f.x, f.y, '#ff4400', 12, 3, 5);
  }

  // Passive: drop fire trail every 40f while speed > 2.5
  const speed = Math.sqrt(f.vx*f.vx + f.vy*f.vy);
  if (speed > f._config.passiveSpeedThreshold && f._passiveTrailTimer <= 0) {
    f._passiveTrailTimer = f._config.passiveTrailInterval;
    fireTrails.push({ 
      x: f.x, y: f.y, 
      life: f._config.fireTrailLife, 
      maxLife: f._config.fireTrailLife, 
      owner: 'blaze', 
      damage: f._config.fireTrailDamage,
      radius: 35
    });
  }

  // Cap horizontal speed only
  const absVx = Math.abs(f.vx);
  if (absVx > f._config.speedCap) f.vx = (f.vx / absVx) * f._config.speedCap;
}
