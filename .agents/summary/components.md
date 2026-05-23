# Components

## Client Components

### BattleSimulation (`src/core/simulation.js`)

Central simulation engine. Manages fighter state, physics, projectiles, and win conditions.

- **Constructor**: Accepts seed, fighter names, optional configs
- **step()**: Advances one frame — updates fighters, physics, projectiles, danger zone
- **runAll()**: Runs simulation to completion, returns winner
- **captureFrame()**: Snapshots current state for playback

Key properties:
- `maxFrames`: 3600 (60 seconds at 60fps)
- `dangerZoneStart`: Frame 1800 (arena shrinks after 30s)
- Deterministic via seeded PRNG

### Fighter Modules (`src/fighters/`)

Each fighter exports `createFighter(W, H, config)` and `updateFighter(fighter, state)`.

| Fighter | Style | Signature Mechanic |
|---------|-------|-------------------|
| Blaze | Aggressive | Fire trails, area damage |
| Quake | Tank | Ground pounds, high mass |
| Spark | Ranged | Electric projectiles that bounce off walls |
| Phantom | Evasive | Teleportation, phasing |

### Physics (`src/core/physics.js`)

Pure functions for physics resolution:
- `applyGravity` — constant downward acceleration
- `applyBounds` — arena boundary enforcement with restitution
- `resolveBallCollision` — elastic collision with mass-based impulse
- `applyFriction` — air resistance

### Projectiles (`src/core/projectiles.js`)

Manages projectile lifecycle: movement, wall bouncing (electric type), hit detection, damage application, knockback, piercing, and trail particles.

### RNG (`src/core/rng.js`)

- `createRNG(seed)` — mulberry32 PRNG
- `hashSeed(str)` — string-to-integer hash for seed initialization

### Renderer (`src/rendering/`)

Canvas 2D rendering split into modules:
- `renderer.js` — main render loop, cracks, explosions
- `drawFighters.js` — per-fighter visual rendering
- `drawEffects.js` — projectiles, particles, fire trails
- `drawUI.js` — HP bars, kill feed, timer, winner display

### Game Orchestrator (`src/game.js`)

Client entry point. Manages:
- Server communication (fetch balance, play slot round)
- Fighter selection UI
- Simulation execution and frame capture
- Playback loop with speed control, slow-motion, screen shake

## Server Components

### App Factory (`server/app.js`)

`createApp(store, aggregator)` — creates Express app with dependency injection. Registers routes, middleware (CORS, JSON parsing, static files).

### Round Domain (`server/round.js`)

Pure domain logic:
- `createRound({fighterA, fighterB, houseEdge}, store)` — generates seed, computes odds
- `placeBet(roundId, {playerId, fighter, stake}, store)` — validates and records bet
- `resolveRound(roundId, store)` — runs simulation, determines winner, settles bets

Includes matchup probability table (Monte Carlo-derived).

### Slot Lifecycle (`server/lifecycle/slot.js`)

`playSlotRound({sessionToken, fighterChoice, stake, aggregator, store})` — orchestrates:
1. Session validation
2. Round creation with random opponent
3. Stake debit
4. Simulation resolution
5. Tiered payout credit (if won)
6. Compensation on failure (refund)

### Payout Engine (`server/payout.js`)

Tiered payout system calibrated for 95% RTP:
- **Obliterate** (HP > 60%): 2.19× multiplier
- **Close Call** (HP 20-60%): 0.95× multiplier
- **Clutch** (HP < 20%): 0.67× multiplier

Final payout = `stake × odds × tier_multiplier`

### Aggregator Adapters (`server/adapters/`)

- `AggregatorAdapter` — abstract interface (validateSession, debit, credit, getBalance)
- `StubAggregatorAdapter` — in-memory implementation for dev/test (starts players at 1000 balance)

### Data Store (`server/stores/memory.js`)

`createMemoryStore()` — in-memory Map-based store for rounds and bets. Interface: getRound, saveRound, getBetsForRound, saveBet, updateBet.
