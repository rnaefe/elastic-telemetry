# Architecture Overview

The **FiveM Log Management System** relies on a decoupled architecture. By isolating the ingest layer from the dashboard layer, and separating search indexing from relational storage, the system achieves stability and performance under heavy load.

---

## High-Level Diagram

```mermaid
graph TD;
    GameServer[FiveM Game Server] -->|HTTP POST JSON| Ingest[Backend Ingest Server]
    Ingest -->|Insert / SQL Queries| Click[(ClickHouse)]
    
    Browser[Staff Web Browser] -->|Auth/View| Dashboard[Next.js Dashboard]
    Dashboard -->|Verify Auth| Discord[Discord OAuth2]
    Dashboard -->|Verify Access| MySQL[(MySQL)]
    Dashboard -->|Proxied Search Request| Ingest
```

---

## Component Breakdown

### 1. The Lua Emitter (`fivem-logging.lua`)
Operating within the FiveM server runtime, the logging resource has one responsibility: capture context and quickly flush it.
- **Non-Blocking:** Uses `PerformHttpRequest` to ensure the main server thread never stutters during logging.
- **Resilience:** If the ingest backend goes down, the Lua layer gracefully swallows errors rather than crashing the FiveM server loop.
- **Pre-configured:** Directly points to your backend instance via internal file variables.

### 2. Node.js Ingest Service
The core highway of the application. High traffic FiveM servers generate hundreds of logs a second (player movements, economy ticks).
- **Technology:** Node.js, Express, and `@clickhouse/client`.
- **Purpose:** Exposes standard endpoints (`/log`, `/logs/bulk`, `/search`, `/stats`, `/meta/terms`) acting as a thin SQL proxy layer over ClickHouse.
- **Security Note:** In the current structure, the Ingest layer blindly accepts logs. It depends on network isolation (e.g., firewalling port 3000 to only accept traffic from the FiveM host and the Dashboard host) to ensure integrity.

### 3. Dual-Database Paradigm
Attempting to store high-volume logs in SQL tables leads to severe performance degradation. This project utilizes two highly optimized engines for their exact intended purposes:
- **ClickHouse (Time-Series / Logging):** Columnar MergeTree storage with month-based partitioning, TTL-driven retention, `LowCardinality` columns for fast filtering, and JSON helpers (`JSONExtract*`) for the dynamic payload. Handles billions of rows with sub-second analytical SQL.
- **MySQL (Configuration / Relational):** Only accessed by the Dashboard. Handles statically structured data such as `log_channels` configs, Discord `users`, and `user_server_access` mappings. Provides robust normalization.

### 4. Next.js Admin Dashboard
The user-facing portal built on modern React paradigms.
- **Framework:** Next.js (Server Components + App Router).
- **Authentication Strategy:** Stateless JWT verification generated locally after verifying identity with Discord. There are no server-side sessions stored in memory.
- **Proxy Layer:** The frontend never touches ClickHouse directly. Search requests from users are authenticated against their MySQL permissions, and then correctly formatted params are proxied securely to the Ingest backend.

---

## Security Posture

1. **Access Control:** Server isolation is maintained in MySQL by the Next.js dashboard. Authenticated users cannot even view log channel definitions of a server they haven't been assigned to via `user_server_access`.
2. **Internal Network Separation:** Because the Node.js ingest listens for `POST /log` without an auth middleware, it is assumed you will close public internet access to the backend's port, explicitly allowing local traffic from your FiveM resources and Next.js instance.
3. **Prevention of Query Injection:** The ClickHouse client uses bound query parameters (`{name:Type}` placeholders). User-supplied filter values from the web are never string-concatenated into SQL.
