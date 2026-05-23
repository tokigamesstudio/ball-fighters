// ═══════════════════════════════════════════════════════════════════════════
// QUAKE — Shockwave
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 85.22;
  return {
    id: 'quake', name: 'Quake', emoji: '🪨', type: 'quake',
    color: '#8B4513', colorAlt: '#A0522D', glow: 'rgba(139,69,19,0.6)',
    x: W - 120, y: 40, vx: -5, vy: 2,
    hp, maxHp: hp, size: 20, mass: 1, alive: true,
    _lastHitBy: null,
    _restitution: 0.95,
    _skillCooldown: 0,
    _projectileTimer: 0,
    _homingTimer: 0,
    _config: {
      skillCooldown: config.skillCooldown ?? 112.60,
      shockwaveRange: config.shockwaveRange ?? 221.58,
      shockwaveDamage: config.shockwaveDamage ?? 35.00,
      shockwaveRepulsion: config.shockwaveRepulsion ?? 7,
      projectileInterval: config.projectileInterval ?? 85,
      projectileDamage: config.projectileDamage ?? 10,
      projectileSpeed: config.projectileSpeed ?? 5,
      homingInterval: config.homingInterval ?? 30,
      homingForce: config.homingForce ?? 0.4,
      speedCap: config.speedCap ?? 6
    }
  };
}

export function updateFighter(f, alive, state) {
  const { projectiles, particles, spawnParticles, nearestEnemyTo, frameEvents } = state;

  const target = nearestEnemyTo(f.x, f.y, 'quake', alive);
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

  // Skill: shockwave if enemy within 200px
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < f._config.shockwaveRange) {
      // Deal damage (reduced at range, full within 120px)
      const damageScale = dist < 120 ? 1.0 : 0.6;
      target.hp -= 10 * damageScale;
      target._lastHitBy = 'quake';
      
      // Apply repulsion impulse
      if (dist > 0) {
        target.vx += (dx/dist) * f._config.shockwaveRepulsion;
        target.vy += (dy/dist) * f._config.shockwaveRepulsion;
      }
      
      // Visual: spawn ring of particles
      if (particles) {
        particles.push({ 
          x: f.x, y: f.y, vx: 0, vy: 0, 
          life: 30, maxLife: 30, 
          color: '#8B4513', size: 40, type: 'ring' 
        });
      }
      if (spawnParticles) spawnParticles(f.x, f.y, '#8B4513', 20, 4, 8);
      
      // Emit shockwave event for ground cracks
      if (frameEvents) {
        frameEvents.push({ type: 'quakeShockwave', x: f.x, y: f.y, range: f._config.shockwaveRange });
      }
    }
  }

  // Between skills: fire slow heavy projectile every 90f
  if (f._projectileTimer <= 0) {
    f._projectileTimer = f._config.projectileInterval;
    const dx = target.x - f.x, dy = target.y - f.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      projectiles.push({
        x: f.x, y: f.y,
        vx: (dx/dist) * f._config.projectileSpeed, 
        vy: (dy/dist) * f._config.projectileSpeed,
        damage: f._config.projectileDamage, 
        owner: 'quake', 
        color: '#8B4513',
        size: 10, life: 150, type: 'rock'
      });
    }
  }

  // Cap horizontal speed only
  const absVx = Math.abs(f.vx);
  if (absVx > f._config.speedCap) f.vx = (f.vx / absVx) * f._config.speedCap;
}
