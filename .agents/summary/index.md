# Documentation Index

> **For AI Assistants**: This file is your primary entry point. Read this first to understand what documentation exists and where to find detailed information. Each section below summarizes a documentation file and indicates when to consult it.

## How to Use This Documentation

1. **Start here** — scan the summaries below to identify which file answers your question
2. **Read the relevant file** — each file is self-contained for its topic
3. **Cross-reference** — files link to each other where topics overlap

## Documentation Files

### [codebase_info.md](codebase_info.md)
**When to consult**: Project identity, tech stack, directory layout, available scripts.

Summary: JavaScript ES Modules project — browser-based arena fighting game with Express 5 backend. Client uses Canvas 2D, server uses PostgreSQL. Vitest for testing. Two npm scripts: `test` and `migrate`.

---

### [architecture.md](architecture.md)
**When to consult**: System design, architectural patterns, design decisions, how client and server relate.

Summary: Hexagonal architecture on server (ports/adapters). Deterministic simulation shared between client and server for provable fairness. Slot-style betting lifecycle with compensation pattern. Domain-driven round model with state machine (open → resolved).

---

### [components.md](components.md)
**When to consult**: Understanding specific modules, what each file does, component responsibilities.

Summary: Client has BattleSimulation engine, 4 fighter modules, physics system, projectile system, canvas renderer. Server has app factory, round domain logic, slot lifecycle orchestrator, tiered payout engine, aggregator adapters, and memory store.

---

### [interfaces.md](interfaces.md)
**When to consult**: API contracts, HTTP endpoints, internal interfaces, data shapes for function parameters.

Summary: HTTP API (POST /slot/play, round CRUD, GET /balance). Internal interfaces: AggregatorAdapter (abstract class), Store interface, Fighter module contract, Simulation state shape.

---

### [data_models.md](data_models.md)
**When to consult**: Data structures, object shapes, database schema, matchup probabilities, payout tiers.

Summary: Round, Bet, Fighter, Projectile, Particle models. Payout tiers (obliterate/close/clutch). Monte Carlo-derived matchup probability table for all 6 fighter pairs.

---

### [workflows.md](workflows.md)
**When to consult**: End-to-end flows, sequence of operations, error handling, balance tuning process.

Summary: Slot round lifecycle (validate → create → debit → simulate → payout). Client playback flow (simulate headlessly → capture frames → render). Compensation flow on errors. Balance tuning scripts workflow.

---

### [dependencies.md](dependencies.md)
**When to consult**: External packages, internal dependency graph, why specific libraries are used.

Summary: 3 production deps (express, cors, pg), 2 dev deps (vitest, supertest). Client has zero npm deps. Internal dependency graph shows simulation engine shared between client and server.

---

## Quick Reference

| Question | File |
|----------|------|
| What tech stack is this? | codebase_info.md |
| How does the server architecture work? | architecture.md |
| What does file X do? | components.md |
| What's the API contract? | interfaces.md |
| What shape is a Round/Bet/Fighter? | data_models.md |
| How does a slot round work end-to-end? | workflows.md |
| What packages are used and why? | dependencies.md |
| How are fighters balanced? | data_models.md (probabilities), workflows.md (tuning) |
| How does provable fairness work? | architecture.md (deterministic simulation) |
