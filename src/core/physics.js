// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS — bounds and collision resolution
// ═══════════════════════════════════════════════════════════════════════════

export function applyGravity(fighter, gravity = 0.4) {
  fighter.vy += gravity;
}

export function applyBounds(fighter, W, H, pad, restitution = 0.98, floorRestitution = 0.85) {
  // Arena bounds with danger zone
  if (fighter.x <= pad + fighter.size) { 
    fighter.x = pad + fighter.size; 
    fighter.vx *= -restitution; 
  }
  if (fighter.x >= W - pad - fighter.size) { 
    fighter.x = W - pad - fighter.size; 
    fighter.vx *= -restitution; 
  }
  if (fighter.y <= pad + fighter.size) { 
    fighter.y = pad + fighter.size; 
    fighter.vy *= -restitution; 
  }
  if (fighter.y >= H - pad - fighter.size) { 
    fighter.y = H - pad - fighter.size; 
    fighter.vy *= -floorRestitution; 
  }
}

export function resolveObstacle(fighter, obstacle) {
  const dx = fighter.x - obstacle.x;
  const dy = fighter.y - obstacle.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  if (dist < obstacle.radius + fighter.size) {
    const overlap = obstacle.radius + fighter.size - dist;
    fighter.x += (dx/dist) * overlap;
    fighter.y += (dy/dist) * overlap;
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
    
    if (dotProduct <= 0) return false; // already separating
    
    const overlap = a.size + b.size - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
    
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

export function applyFriction(fighter, friction = 0.995) {
  fighter.vx *= friction; // slight air resistance only
}
