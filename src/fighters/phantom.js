// ═══════════════════════════════════════════════════════════════════════════
// PHANTOM — Teleport
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 82.64;
  return {
    id: 'phantom', name: 'Phantom', emoji: '👻', type: 'phantom',
    color: '#9B59B6', colorAlt: '#BB79D6', glow: 'rgba(155,89,182,0.6)',
    x: W - 120, y: 40, vx: -5, vy: 2,
    hp, maxHp: hp, size: 20, mass: 1, alive: true,
    _lastHitBy: null,
    _restitution: 0.95,
    _skillCooldown: 0,
    _projectileTimer: 0,
    _homingTimer: 0,
    _config: {
      skillCooldown: config.skillCooldown ?? 200.00,
      teleportPrediction: config.teleportPrediction ?? 40,
      dashPower: config.dashPower ?? 9.00,
      boltDamage: config.boltDamage ?? 26.83,
      skillBoltSpeed: config.skillBoltSpeed ?? 8,
      projectileInterval: config.projectileInterval ?? 100,
      projectileSpeed: config.projectileSpeed ?? 6,
      homingInterval: config.homingInterval ?? 23.95,
      homingForce: config.homingForce ?? 0.4,
      speedCap: config.speedCap ?? 6
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, particles, spawnParticles, nearestEnemyTo, W, H, rng } = state;

  const target = nearestEnemyTo(f.x, f.y, 'phantom', alive);
  if (!target) return;

  f._skillCooldown--;
  f._projectileTimer--;
  f._homingTimer--;

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

  // Skill: TRUE TELEPORT to flanking position + fire shadow bolt
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    const oldX = f.x, oldY = f.y;
    
    // Calculate perpendicular flanking position
    const evx = target.vx || 0, evy = target.vy || 0;
    const evLen = Math.sqrt(evx*evx + evy*evy);
    
    let perpX, perpY;
    if (evLen > 0.1) {
      // Enemy is moving: flank perpendicular to velocity
      perpX = -evy/evLen;
      perpY = evx/evLen;
    } else {
      // Enemy stationary: use random direction
      const angle = rng() * Math.PI * 2;
      perpX = Math.cos(angle);
      perpY = Math.sin(angle);
    }
    
    const side = rng() > 0.5 ? 1 : -1;
    const flankDist = 100 + rng() * 60;
    
    const pad = 40;
    let destX = target.x + perpX * side * flankDist;
    let destY = target.y + perpY * side * flankDist;
    destX = Math.max(pad + f.size, Math.min(W - pad - f.size, destX));
    destY = Math.max(pad + f.size, Math.min(H - pad - f.size, destY));
    
    // INSTANT TELEPORT: set position directly
    f.x = destX;
    f.y = destY;
    
    // Reset velocity to moderate value toward enemy (speed 3)
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      f.vx = (dx/dist) * 3;
      f.vy = (dy/dist) * 3;
    } else {
      f.vx = 0;
      f.vy = 0;
    }
    
    // Visual effects: ghost at old position + arrival ring at new position
    if (particles) {
      particles.push({ 
        x: oldX, y: oldY, vx: 0, vy: 0, 
        life: 25, maxLife: 25, 
        color: '#9B59B6', size: 20, type: 'ring' 
      });
      particles.push({ 
        x: f.x, y: f.y, vx: 0, vy: 0, 
        life: 25, maxLife: 25, 
        color: '#9B59B6', size: 20, type: 'ring' 
      });
    }
    
    // Fire shadow bolt from new position toward enemy
    if (dist > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (dx/dist) * f._config.skillBoltSpeed, 
        vy: (dy/dist) * f._config.skillBoltSpeed,
        damage: f._config.boltDamage, 
        owner: 'phantom', 
        color: '#9B59B6',
        size: 9, life: 100, type: 'shadow_bolt'
      });
    }
    
    // Reset projectile timer so we don't double-fire
    f._projectileTimer = f._config.projectileInterval;
  }

  // Between skills: fire shadow bolt every 100f
  if (f._projectileTimer <= 0) {
    f._projectileTimer = f._config.projectileInterval;
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (dx/dist) * f._config.projectileSpeed, 
        vy: (dy/dist) * f._config.projectileSpeed,
        damage: f._config.boltDamage, 
        owner: 'phantom', 
        color: '#9B59B6',
        size: 7, life: 100, type: 'shadow_bolt'
      });
    }
  }

  // Cap horizontal speed only
  const absVx = Math.abs(f.vx);
  if (absVx > f._config.speedCap) f.vx = (f.vx / absVx) * f._config.speedCap;
}
