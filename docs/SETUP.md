# Installation & Setup Guide

This document outlines the end-to-end installation process for deploying the FiveM Log Management System in a production or development environment.

---

## 1. System Requirements

Before beginning, ensure your host machine (or isolated VPS instances) meet the following prerequisites:

- **Node.js:** v22.0 or higher.
- **MySQL:** v8.0 or higher (MariaDB equivalent is compatible).
- **ClickHouse:** v24.x or higher (A single node is sufficient for most medium servers).
- **PM2 / Screen:** For managing background application processes in a production setting.
- **Discord Developer Application:** Required for OAuth2 staff logins.

---

## 2. ClickHouse Installation

ClickHouse is the backbone of the logging system's time-series storage.

**Option A — Docker (fastest):**
```bash
docker run -d --name fiveops-ch \
  -p 8123:8123 -p 9000:9000 \
  -v fiveops-ch-data:/var/lib/clickhouse \
  clickhouse/clickhouse-server
```

**Option B — Native install:** follow the [official ClickHouse install guide](https://clickhouse.com/docs/en/install) for your OS, then start the `clickhouse-server` service.

Verify the HTTP interface is reachable:
```bash
curl http://localhost:8123/ping   # should return: Ok.
```

The backend will create the `fiveops` database and `logs` table automatically on first start (see `backend/src/clickhouse/bootstrap.js`). The TTL is derived from `LOG_RETENTION_DAYS` (default 90). If you change that value after the table already exists, run a one-off:

```sql
ALTER TABLE fiveops.logs MODIFY TTL toDateTime(timestamp) + INTERVAL 180 DAY;
```

---

## 3. Database Initialization

The relational state of the application (configurations, users, channels) is governed by MySQL.

1. Access your MySQL terminal:
   ```bash
   mysql -u root -p
   ```
2. Create the database and import the schema script:
   ```sql
   CREATE DATABASE fivem_logs;
   USE fivem_logs;
   source backend/database/schema.sql;
   ```
3. Ensure the tables (`servers`, `users`, `user_server_access`, `log_channels`, etc.) have been populated successfully.

---

## 4. Backend Service Configuration (Ingest)

The backend service is responsible for ingesting logs and bridging ClickHouse queries. It does not connect to MySQL.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Copy the template environment file:
   ```bash
   cp env.example .env
   ```
3. Ensure your ClickHouse URL is correct inside `.env` (`CLICKHOUSE_URL=http://localhost:8123`).
4. Start the application:
   ```bash
   npm run prod
   ```
   *Note: Use PM2 or a systemd service file to keep this running permanently.*

---

## 5. Discord Application Registration

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**. Name it appropriately.
3. Navigate to the **OAuth2** tab.
4. Add a redirect URI matching where your dashboard will reside:
   - Development: `http://localhost:3001/api/auth/callback`
   - Production: `https://logs.yourdomain.com/api/auth/callback`
5. Note down your **Client ID** and **Client Secret**.

---

## 6. Dashboard Deployment (Frontend)

The frontend visualizer runs via Next.js and connects to both MySQL (for settings/auth) and the Backend Ingest service.

1. Navigate to the `dashboard` directory:
   ```bash
   cd dashboard
   npm install
   ```
2. Copy the `.env` template:
   ```bash
   cp env.example .env.local
   ```
3. Update `.env.local` exactly:
   ```text
   MYSQL_HOST=localhost
   MYSQL_USER=your_user
   MYSQL_PASSWORD=your_pass
   MYSQL_DATABASE=fivem_logs

   # Generate a secure JWT secret: openssl rand -hex 32
   JWT_SECRET=super_secure_random_string

   DISCORD_CLIENT_ID=copied_from_step_5
   DISCORD_CLIENT_SECRET=copied_from_step_5
   DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/callback

   NEXT_PUBLIC_API_URL=http://localhost:3050
   ```
4. Build and start the Next.js production server:
   ```bash
   npm run build
   npm start
   ```

---

## 7. Configuration Defaults

Make sure to assign yourself access to a server context to use the Dashboard!

1. Open your MySQL client and find the `servers` table.
2. Insert a new server defining your identifier and a custom `api_key`:
   ```sql
   INSERT INTO servers (identifier, name, api_key) 
   VALUES ('rp_server_1', 'Main Roleplay Server', 'fivem_3d31edce-c1a9-4ba1-837c-f905232c4a1e');
   ```
3. Grant yourself access to this server via your Discord user ID inside `user_server_access`.
4. The Backend Lua ingest code inside your FiveM server utilizes `sv_projectName` (which evaluates as `rp_server_1` based on your `server.cfg`). Read `docs/INTEGRATION.md` for finalizing the FiveM game server scripts.
