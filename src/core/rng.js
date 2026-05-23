// ═══════════════════════════════════════════════════════════════════════════
// SEEDED PRNG — mulberry32 (deterministic)
// ═══════════════════════════════════════════════════════════════════════════
export function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { 
    hash = ((hash << 5) - hash) + str.charCodeAt(i); 
    hash = hash & hash; 
  }
  return Math.abs(hash) || 1;
}
