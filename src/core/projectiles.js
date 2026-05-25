// ═══════════════════════════════════════════════════════════════════════════
// PROJECTILES — projectile update logic
// ═══════════════════════════════════════════════════════════════════════════

export function updateProjectiles(state) {
  const { projectiles, fighters, particles, frameEvents, frame, rng, W, H } = state;
  
  // Helper to spawn particles
  function spawnParticles(x, y, color, count, size, speed) {
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const spd = (0.3 + rng()) * speed;
      particles.push({
        x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        life: 18 + rng()*20, maxLife: 38, color, size: (0.4+rng())*size, type: 'spark'
      });
    }
  }
  
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx; 
    p.y += p.vy;
    p.life--;

    // Electric projectiles bounce off walls
    if (p.type === 'electric') {
      const pad = 50;
      if (p.x <= pad || p.x >= W - pad) { 
        p.x = p.x <= pad ? pad : W - pad; 
        p.vx *= -1; 
      }
      if (p.y <= pad || p.y >= H - pad) { 
        p.y = p.y <= pad ? pad : H - pad; 
        p.vy *= -1; 
      }
    }

    // Out of bounds or expired (electric projectiles don't die from bounds)
    if (p.life <= 0 || (p.type !== 'electric' && !p.bounces && (p.x < -20 || p.x > W+20 || p.y < -20 || p.y > H+20))) {
      projectiles.splice(i, 1); 
      continue;
    }

    // Hit fighters
    for (const f of fighters) {
      if (f.alive === false || f.id === p.owner || f.phasing || (f.type === 'void' && f.phased)) continue;
      if (p.piercing && p.pierced && p.pierced.includes(f.id)) continue;
      const dx = f.x - p.x, dy = f.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < f.size + p.size) {
        const variance = 0.8 + rng() * 0.4;
        const actualDamage = p.damage * variance;
        f.hp -= actualDamage;
        f._lastHitBy = p.owner;
        frameEvents.push({ type: 'damage', x: p.x, y: p.y, amount: Math.round(actualDamage), color: p.color });
        spawnParticles(p.x, p.y, p.color, 6, 3, 4);
        spawnParticles(p.x, p.y, '#fff', 3, 2, 3);
        // Knockback
        const kd = dist || 1;
        f.vx += (dx/kd) * p.damage * 0.12;
        f.vy += (dy/kd) * p.damage * 0.12;
        
        // Note: frameEvents push would happen in the simulation, not here
        // We're just extracting the projectile logic

        if (p.piercing) {
          p.pierced.push(f.id);
          p.damage *= 0.7;
        } else {
          projectiles.splice(i, 1);
        }
        break;
      }
    }

    // Trail particles
    if (frame % 3 === 0 && projectiles[i]) {
      particles.push({
        x: p.x, y: p.y, vx: (rng()-0.5)*0.5, vy: (rng()-0.5)*0.5,
        life: 10, maxLife: 10, color: p.color, size: p.size * 0.4, type: 'trail'
      });
    }
  }
}
