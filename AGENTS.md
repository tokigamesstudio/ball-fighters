# AGENTS.md

## Project Overview

Browser-based arena fighting game with slot-style betting backend. JavaScript ES Modules throughout. Client renders via Canvas 2D; server runs Express 5 with hexagonal architecture.

## Directory Map

```
src/
├── core/           → Simulation engine, physics, RNG, projectiles
├── fighters/       → Fighter AI modules (blaze, quake, spark, phantom)
├── rendering/      → Canvas 2D rendering (fighters, effects, UI)
└── game.js         → Client entry point (UI orchestration, server calls, playback)

server/
├── adapters/       → Aggregator adapter implementations (wallet integration)
├── lifecycle/      → Business workflow orchestration (slot round)
├── ports/          → Port interfaces (wallet, simulation bridge)
├── routes/         → Express route handlers
├── stores/         → Data store implementations (memory, PostgreSQL)
├── migrations/     → SQL schema migrations
├── app.js          → Express app factory (DI entry point)
├── round.js        → Round domain logic + error types + matchup probabilities
├── payout.js       → Tiered payout calculation (obliterate/close/clutch)
├── odds.js         → Odds formula: (1 - houseEdge) / winProb
└── index.js        → Server entry (port 3001)

scripts/            → Monte Carlo balance tuning (tune-balance, tune-parallel)
tests/              → Vitest tests (mirrors src/ and server/ structure)
docs/game-math.md   → Mathematical foundations for game balance
```

## Key Entry Points

| Task | Start Here |
|------|-----------|
| Understand the simulation | `src/core/simulation.js` (BattleSimulation class) |
| Add/modify a fighter | `src/fighters/` — each exports `createFighter` + `updateFighter` |
| Change server API | `server/routes/slot.js` → `server/lifecycle/slot.js` |
| Modify payout logic | `server/payout.js` (tiers) + `server/round.js` (odds) |
| Add a new aggregator | Extend `server/adapters/aggregator-interface.js` |
| Run balance tuning | `scripts/tune-balance.js` or `scripts/tune-parallel.js` |
| Database schema | `server/migrations/001_initial.sql` |

## Architecture Patterns (Non-Default)

- **Hexagonal/Ports-Adapters** on server — `server/ports/` defines interfaces, `server/adapters/` implements them. App factory injects dependencies.
- **Shared simulation** — `server/ports/simulation.js` imports `src/core/simulation.js` directly. Same deterministic code runs on both client and server for provable fairness.
- **Compensation pattern** — `server/lifecycle/slot.js` debits first, then refunds on failure. Failed refunds are logged for manual reconciliation.
- **Idempotent transactions** — All wallet operations use unique `txRef` strings for deduplication.
- **Tiered payouts** — Winner's remaining HP determines payout multiplier (not just win/lose).

## Fighter Module Contract

Each fighter in `src/fighters/` exports:
```javascript
export function createFighter(W, H, config) → Fighter
export function updateFighter(fighter, state) → void (mutates)
```

State object passed to `updateFighter`:
```javascript
{ fighters, projectiles, particles, frameEvents, frame, rng, W, H, dangerPad, fireTrails }
```

## Matchup Probabilities (Monte Carlo-derived)

Used in `server/round.js` for odds calculation:
- blaze:quake → 53.5% / 46.5%
- blaze:spark → 38.4% / 61.6%
- blaze:phantom → 49.4% / 50.6%
- quake:spark → 62.3% / 37.7%
- phantom:quake → 30.7% / 69.3%
- phantom:spark → 61.8% / 38.2%

## Known Issues

- **Port mismatch**: Server defaults to 3001 (`server/index.js`), client hardcodes 4001 (`src/game.js`). Use `PORT` env var or update client.
- **events.js stub**: `src/core/events.js` is minimal/unused.

## Detailed Documentation

See `.agents/summary/index.md` for comprehensive documentation with architecture diagrams, data models, and workflow sequences.

## Custom Instructions
<!-- This section is for human and agent-maintained operational knowledge.
     Add repo-specific conventions, gotchas, and workflow rules here.
     This section is preserved exactly as-is when re-running codebase-summary. -->

- Math upload output goes in versioned folders: `dist/math/v1/`, `dist/math/v2/`, etc. Never overwrite previous versions.
