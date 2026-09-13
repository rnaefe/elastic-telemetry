<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="60" alt="Next.js"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="Node.js"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/refs/heads/main/icons/Elasticsearch-Dark.svg" width="60" alt="Elasticsearch"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MySQL-Dark.svg" width="60" alt="MySQL"/>

  <br/>
  <br/>

  <h1>Elastic Telemetry</h1>
  <p>
    High-volume runtime logs, searchable in seconds, without making the source runtime do database work.
  </p>

  <p>
    <a href="#why-it-works">Why it works</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#system-boundaries">System boundaries</a> •
    <a href="docs/SETUP.md">Setup</a> •
    <a href="SHOWCASE.md">Showcase</a>
  </p>
</div>

---

## What This Is

Elastic Telemetry is a telemetry pipeline for noisy, semi-structured runtime events. Any process that can send JSON can use it: workers, backend services, automation jobs, edge runtimes, multiplayer servers, or custom adapters. The source runtime emits events, a small Node.js service indexes them, Elasticsearch does the heavy search work, and a Next.js dashboard gives operators a permission-aware control surface.

The impressive part is not that it stores logs. Plenty of systems store logs. The useful part is where the work happens:

- The source runtime only captures context and fires an async HTTP request.
- Node.js normalizes the event envelope and writes to Elasticsearch.
- Elasticsearch owns search, filtering, date ranges, fuzzy player lookup, and aggregations.
- MySQL owns structured state: users, sessions, servers, log channels, and access mappings.
- Next.js owns authentication and query proxying so the browser never gets raw Elasticsearch access.

That split is the whole trick. The hot path stays thin, the query path stays powerful, and operator permissions stay in a relational system that is good at relational state.

## Why It Works

- **Runtime cost stays small.** Emitters collect local context, attach server/service metadata, and post JSON. They do not try to search, aggregate, or persist locally.
- **The ingest service is deliberately narrow.** Express accepts `/log`, stamps `@timestamp` when needed, normalizes common `event_type` variants, and indexes one document into the configured Elasticsearch index.
- **Search is built from structured filters.** `/search` composes Elasticsearch Query DSL for licenses, event types, categories, server IDs, dev-server flags, date ranges, fuzzy player names, and broad text search across known payload fields.
- **Analytics run where the data lives.** Weapon, vehicle, category, event-type, daily trend, and unique-player stats use Elasticsearch aggregations instead of replaying logs through the app server.
- **Access control is not hidden in the UI.** Dashboard API routes load the current user from a JWT-backed session, check MySQL access tables, then proxy allowed queries to the backend with the server identifier forced into the request.
- **Dynamic payloads stay dynamic.** The Elasticsearch mapping pins the fields the system depends on, while `payload` remains `dynamic: true` for event-specific metadata.

## Architecture

```mermaid
flowchart TD
    A[Runtime emitters / adapters] -->|async JSON events| B[Express ingest API]
    B -->|index documents| C[(Elasticsearch)]
    B -->|search + aggregations| C

    D[Staff browser] --> E[Next.js dashboard]
    E -->|Discord OAuth + JWT session| F[Discord]
    E -->|users, sessions, servers, channels, access| G[(MySQL)]
    E -->|authorized search proxy| B
```

The system is intentionally split into two backends:

- `backend/` is the fast path: ingest, search, metadata, and stats against Elasticsearch.
- `dashboard/` is the control plane: Discord OAuth, sessions, MySQL-backed access checks, admin screens, and operator UI.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the deeper breakdown.

## What You Get

- Runtime adapter pattern for sending structured events from any service that can make HTTP requests.
- Client-agnostic JSON ingest endpoint for anything that can `POST /log`.
- Elasticsearch bootstrap mapping for timestamp, event type, category, server, player identifiers, and dynamic payload fields.
- Search endpoint with pagination, filters, fuzzy player-name matching, date ranges, and full-text query support.
- Stats endpoints for general activity, weapon usage, and vehicle usage.
- Next.js dashboard with Discord OAuth, JWT sessions, server access checks, admin routes, and log/channel management screens.
- Backend query endpoints protected by an internal key so browser traffic goes through Next.js access checks instead of talking to Elasticsearch-facing routes directly.

## Trade-Offs

| Decision | Why | Cost |
|---|---|---|
| Thin HTTP ingest instead of a broker-first design | Keeps deployment and emitter integration simple | Extreme burst buffering belongs in infrastructure or a future queue layer |
| Elasticsearch for event data | Search, filters, fuzzy lookup, and aggregations stay close to the data | Requires operating a second datastore |
| MySQL for control state | Users, sessions, servers, channels, and access mappings are relational | Application state and telemetry live in different systems |
| Next.js as an authorization proxy | Raw Elasticsearch-facing routes stay away from browser clients | Dashboard requests take an extra application hop |
| Dynamic event payloads | Adapters can attach event-specific metadata without schema churn | Stable fields still need explicit mappings and query discipline |

## System Boundaries

This repository intentionally does **not** pretend to solve every observability problem.

- There is no durable broker between emitters and Elasticsearch in the current design. If sustained burst buffering is required, a queue belongs in front of the indexing path.
- API keys reduce accidental exposure but do not replace network boundaries. Keep ingest private where possible.
- Elasticsearch owns telemetry/search behavior; MySQL is not a fallback event store.
- The dashboard enforces application-level access before proxying searches, so exposing Elasticsearch directly to browser clients defeats the intended trust boundary.
- Dynamic payloads make the ingest surface flexible, but fields that become operationally important should graduate into explicit mappings and documented query contracts.

These constraints are deliberate: the project optimizes for a thin runtime path, useful search, and understandable operations before adding distributed infrastructure.

## Setup

Start here:

- [docs/SETUP.md](docs/SETUP.md) for installation and environment configuration.
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for ingest, search, metadata, and stats endpoints.
- [backend/database/README.md](backend/database/README.md) for the MySQL schema.

For a local full-stack run:

```bash
docker compose up --build
```

## Showcase

Browse the full dashboard gallery in [SHOWCASE.md](SHOWCASE.md).

<p align="center">
  <img src="https://github.com/user-attachments/assets/66525288-fdf6-42b3-a729-0df39d6e3f38" alt="Dashboard screenshot 1" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/51c39270-747f-4201-8bdc-38ba39a77791" alt="Dashboard screenshot 2" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/2b56df47-e797-4efa-bc20-244a7ecd202e" alt="Dashboard screenshot 3" width="100%" />
</p>
