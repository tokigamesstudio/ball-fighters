# Codebase Information

## Project Identity

- **Name**: game-project-prototype
- **Type**: Browser-based arena fighting game with betting backend
- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js (server), Browser (client)
- **Package Manager**: npm

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Client Rendering | HTML5 Canvas 2D |
| Client Logic | Vanilla JS ES Modules |
| Server Framework | Express 5 |
| Database | PostgreSQL (pg driver) |
| Test Framework | Vitest |
| HTTP Testing | Supertest |

## Module System

- ES Modules (`"type": "module"` in package.json)
- No bundler for client (served as static files via Express)
- Vitest uses vite-node for test execution

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| test | `vitest run` | Run test suite |
| migrate | `node server/migrate.js` | Run database migrations |

## Directory Layout

```
├── src/                  # Client-side game code
│   ├── core/             # Simulation engine, physics, RNG, projectiles
│   ├── fighters/         # Fighter implementations (blaze, quake, spark, phantom)
│   ├── rendering/        # Canvas rendering (fighters, effects, UI)
│   └── game.js           # Client entry point (orchestrates UI + server calls)
├── server/               # Backend API
│   ├── adapters/         # Aggregator adapter implementations
│   ├── lifecycle/        # Business logic orchestration (slot round)
│   ├── ports/            # Port interfaces (wallet, simulation)
│   ├── routes/           # Express route handlers
│   ├── stores/           # Data store implementations
│   ├── migrations/       # SQL migration files
│   ├── app.js            # Express app factory
│   ├── round.js          # Round domain logic + error types
│   ├── payout.js         # Tiered payout calculation
│   ├── odds.js           # Odds calculation
│   └── index.js          # Server entry point
├── tests/                # Test files (mirrors src/ and server/ structure)
├── scripts/              # Balance tuning scripts (Monte Carlo, parallel tuning)
├── docs/                 # Game math documentation
├── index.html            # Client HTML entry point
└── vitest.config.js      # Test configuration
```
