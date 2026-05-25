// ═══════════════════════════════════════════════════════════════════════════
// BLAZE — Fire Trail (constant-speed: drops fire where it travels)
// ═══════════════════════════════════════════════════════════════════════════

export function createFighter(W, H, config = {}) {
  const hp = config.hp ?? 76;
  return {
    id: 'blaze', name: 'Blaze', emoji: '🔥', type: 'blaze',
    color: '#ff4400', colorAlt: '#ff8800', glow: 'rgba(255,68,0,0.6)',
    x: 120, y: H * 0.4, vx: 4, vy: 3,
    hp, maxHp: hp, size: 20, mass: 1.2, alive: true,
    _lastHitBy: null,
    _restitution: 1.0,
    _skillCooldown: 0,
    _passiveTrailTimer: 0,
    _config: {
      speed: config.speed ?? 5,
      skillCooldown: config.skillCooldown ?? 120,
      fireTrailDamage: config.fireTrailDamage ?? 1.5,
      fireTrailLife: config.fireTrailLife ?? 120,
      passiveTrailInterval: config.passiveTrailInterval ?? 20,
    }
  };
}

export function updateFighter(f, alive, state) {
  const { fireTrails, spawnParticles } = state;

  f._skillCooldown--;
  f._passiveTrailTimer--;

  // Passive: constantly drops fire trail behind it
  if (f._passiveTrailTimer <= 0) {
    f._passiveTrailTimer = f._config.passiveTrailInterval;
    fireTrails.push({ 
      x: f.x, y: f.y, 
      life: f._config.fireTrailLife, maxLife: f._config.fireTrailLife, 
      owner: 'blaze', damage: f._config.fireTrailDamage, radius: 30
    });
  }

  // Skill: burst of fire trails in a spread pattern
  if (f._skillCooldown <= 0) {
    f._skillCooldown = f._config.skillCooldown;
    for (let i = 0; i < 5; i++) {
      const offset = (i - 2) * 15;
      fireTrails.push({ 
        x: f.x + offset, y: f.y + offset, 
        life: f._config.fireTrailLife, maxLife: f._config.fireTrailLife, 
        owner: 'blaze', damage: f._config.fireTrailDamage * 1.5, radius: 35
      });
    }
    if (spawnParticles) spawnParticles(f.x, f.y, '#ff4400', 12, 3, 5);
  }
}
