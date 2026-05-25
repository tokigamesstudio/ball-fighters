// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS — constant-speed bouncing arena (no gravity, no acceleration)
// ═══════════════════════════════════════════════════════════════════════════

export function applyGravity() {}

export function applyBounds(fighter, W, H, pad, rng) {
  let bounced = false;
  if (fighter.x <= pad + fighter.size) { 
    fighter.x = pad + fighter.size; 
    fighter.vx = Math.abs(fighter.vx);
    bounced = true;
  }
  if (fighter.x >= W - pad - fighter.size) { 
    fighter.x = W - pad - fighter.size; 
    fighter.vx = -Math.abs(fighter.vx);
    bounced = true;
  }
  if (fighter.y <= pad + fighter.size) { 
    fighter.y = pad + fighter.size; 
    fighter.vy = Math.abs(fighter.vy);
    bounced = true;
  }
  if (fighter.y >= H - pad - fighter.size) { 
    fighter.y = H - pad - fighter.size; 
    fighter.vy = -Math.abs(fighter.vy);
    bounced = true;
  }
  if (bounced && rng) {
    fighter.vx += (rng() - 0.5) * 1.5;
    fighter.vy += (rng() - 0.5) * 1.5;
  }
}

// Maintain constant speed after any velocity change
export function enforceConstantSpeed(fighter) {
  const speed = Math.sqrt(fighter.vx * fighter.vx + fighter.vy * fighter.vy);
  const target = fighter._config?.speed ?? 5;
  if (speed > 0) {
    fighter.vx = (fighter.vx / speed) * target;
    fighter.vy = (fighter.vy / speed) * target;
  } else {
    // If somehow stopped, pick a random direction
    const angle = Math.random() * Math.PI * 2;
    fighter.vx = Math.cos(angle) * target;
    fighter.vy = Math.sin(angle) * target;
  }
}

export function capSpeed() {}
export function applyFriction() {}

export function resolveObstacle(fighter, obstacle) {
  const dx = fighter.x - obstacle.x;
  const dy = fighter.y - obstacle.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  if (dist < obstacle.radius + fighter.size) {
    const overlap = obstacle.radius + fighter.size - dist;
    fighter.x += (dx/dist) * overlap;
    fighter.y += (dy/dist) * overlap;
    // Reflect off obstacle
    fighter.vx += (dx/dist) * 2;
    fighter.vy += (dy/dist) * 2;
  }
}

export function resolveBallCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  if (dist < a.size + b.size && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dotProduct = dvx * nx + dvy * ny;
    
    if (dotProduct <= 0) return false;
    
    // Separate
    const overlap = a.size + b.size - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
    
    // Elastic collision (mass-based direction change)
    const m1 = a.mass || 1;
    const m2 = b.mass || 1;
    const impulse = (2 * dotProduct) / (m1 + m2);
    
    a.vx -= impulse * m2 * nx;
    a.vy -= impulse * m2 * ny;
    b.vx += impulse * m1 * nx;
    b.vy += impulse * m1 * ny;
    
    return true;
  }
  
  return false;
}
