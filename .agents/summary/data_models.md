# Data Models

## Round

```javascript
{
  id: "uuid",
  seed: "hex",              // 16 random bytes, revealed after resolution
  seedHash: "sha256hex",    // Published before bets for provable fairness
  fighterA: "blaze",
  fighterB: "quake",
  oddsA: 1.78,              // Decimal odds (includes house edge)
  oddsB: 2.04,
  status: "open" | "resolved",
  winner: "blaze",          // Set on resolution
  result: { ... }           // Full simulation result
}
```

## Bet

```javascript
{
  id: "uuid",
  roundId: "uuid",
  playerId: "string",
  fighter: "blaze",
  stake: 100,
  odds: 1.78,
  potentialPayout: 178,
  status: "pending" | "won" | "lost",
  txRef: "bet-uuid"
}
```

## Fighter (Runtime)

```javascript
{
  id: 0,
  type: "fire",             // Internal type identifier
  name: "Blaze",            // Display name
  x: 150, y: 300,           // Position
  vx: 0, vy: 0,            // Velocity
  hp: 100, maxHp: 100,
  size: 18,                 // Collision radius
  mass: 1.0,               // Affects collision impulse
  alive: true,
  color: "#ff4400",
  skill: "fireball",
  skillCooldown: 0,
  _lastHitBy: null          // Tracks killer for kill feed
}
```

## Projectile

```javascript
{
  x, y, vx, vy,
  size: 6,
  damage: 15,
  life: 60,                 // Frames remaining
  owner: 0,                 // Fighter ID
  type: "fire" | "electric",
  color: "#ff4400",
  piercing: false,          // Passes through targets
  pierced: [],              // IDs already hit (for piercing)
  bounces: false            // Bounces off walls (electric)
}
```

## Particle

```javascript
{
  x, y, vx, vy,
  life: 18, maxLife: 38,
  color: "#ff4400",
  size: 3,
  type: "spark" | "trail"
}
```

## Payout Tiers

```javascript
{
  obliterate: { hpThreshold: 0.6, multiplier: 2.19, label: "Obliterate" },
  close:      { hpThreshold: 0.2, multiplier: 0.95, label: "Close Call" },
  clutch:     { hpThreshold: 0,   multiplier: 0.67, label: "Clutch" }
}
```

## Matchup Probabilities (Monte Carlo-derived)

| Matchup | Win Rates |
|---------|-----------|
| blaze:quake | blaze 53.5%, quake 46.5% |
| blaze:spark | blaze 38.4%, spark 61.6% |
| blaze:phantom | blaze 49.4%, phantom 50.6% |
| quake:spark | quake 62.3%, spark 37.7% |
| phantom:quake | phantom 30.7%, quake 69.3% |
| phantom:spark | phantom 61.8%, spark 38.2% |

## Database Schema (PostgreSQL)

Defined in `server/migrations/001_initial.sql`. Used for persistent storage (production). The memory store mirrors this schema in-memory for dev/test.
