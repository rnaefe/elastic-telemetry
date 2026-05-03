# API Reference

The backend exposes a lightweight REST API mapping to ClickHouse tables.

The provided Lua wrapper script (`fivem-logging.lua`) interacts with the `/log` endpoint natively. Next.js proxies traffic to `/search`, `/stats*`, and `/meta/terms`.

---

## Ingest Endpoints

### 1. Ingest Log

**Endpoint:** `POST /log`

Submits a single log entry. The backend will automatically add a `@timestamp` field if one is not provided, and generates a UUID for the row.

**Content-Type:** `application/json`

**Request Body Example:**

```json
{
  "event_type": "item_swapped",
  "category": "inventory",
  "isDevServer": false,
  "server": {
    "name": "My FiveM Server",
    "id": "sv_123"
  },
  "payload": {
    "action": "move",
    "source": 1,
    "count": 5
  },
  "player": {
    "id": 1,
    "name": "PlayerName",
    "identifiers": {
      "license": "license:abc123def"
    }
  }
}
```

**Success Response:**
`HTTP 201 Created`

```json
{
  "ok": true,
  "id": "uuid"
}
```

### 2. Ingest Logs (Bulk)

**Endpoint:** `POST /logs/bulk`

Optional batched ingest endpoint. Useful for high-volume FiveM resources that buffer logs locally before flushing.

**Request Body:** Either a bare JSON array, or `{ "logs": [...] }`. Each entry has the same shape as the single-log payload above.

**Success Response:**
`HTTP 201 Created`

```json
{
  "ok": true,
  "inserted": 100
}
```

If any entry is missing `event_type`, the entire batch is rejected with `HTTP 400` and the offending `index`.

---

## Query Endpoints

### 1. Search Time-Series Logs

**Endpoint:** `GET /search`

Queries historical logs formatted for the dashboard. The dashboard automatically appends required parameters based on user permissions.

**Parameters:**
- `server_id` (String, optional): Exact match on the server identifier.
- `page` (Int, optional): Pagination index, default `1`.
- `limit` (Int, optional): Elements per page, default `50`, max `500`.
- `q` (String, optional): Case-insensitive substring across player_name, server_name, event_type, category, message, resource_name, and the raw payload JSON.
- `categories` (String, optional): Comma-separated list of log categories to filter (or `category` for a single value).
- `event_types` (String, optional): Comma-separated list of exact events to filter (or `event_type` for a single value).
- `license`, `player_name`, `server_name`, `isDevServer`, `date_from`, `date_to` — see the source for full semantics.

**Example Request:**
```http
GET /search?server_id=sv_123&page=1&limit=25&categories=combat
```

**Response shape (preserves the prior `_id` / `_source` envelope used by the dashboard):**
```json
{
  "items": [
    {
      "_id": "uuid",
      "_source": {
        "@timestamp": "2026-05-02T14:00:00.000Z",
        "server": { "id": "sv_123", "name": "My FiveM Server" },
        "isDevServer": false,
        "category": "combat",
        "event_type": "player_killed",
        "player": {
          "name": "PlayerName",
          "source": 1,
          "identifiers": { "license": "license:abc" }
        },
        "payload": { "weaponName": "WEAPON_PISTOL" },
        "message": "",
        "resourceName": ""
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 25
}
```

### 2. Analytical Stat Aggregation

**Endpoints:** `GET /stats`, `GET /stats/weapons`, `GET /stats/vehicles`

Built on ClickHouse analytical SQL (`GROUP BY`, `countIf`, `uniqExact`, `JSONExtractString`) over the partitioned `fiveops.logs` table. All endpoints require `server_id`.

**Parameters:**
- `server_id` (String, required)
- `days` (Int, optional, default `7`, max `365`)
- `limit` (Int, optional for `/stats/weapons` and `/stats/vehicles`, default `10`, max `100`)

**Response (`GET /stats/weapons`):**
```json
{
  "weapons": [
    { "name": "WEAPON_PISTOL", "total": 142, "kills": 90, "deaths": 52 }
  ],
  "total": 142,
  "period": "7 days"
}
```

**Response (`GET /stats/vehicles`):**
```json
{
  "vehicles": [
    { "name": "adder", "count": 35 }
  ],
  "total": 35,
  "period": "7 days"
}
```

**Response (`GET /stats`):**
```json
{
  "total": 10000,
  "today": 1000,
  "uniquePlayers": 150,
  "byCategory": [{ "category": "combat", "count": 5000 }],
  "byEventType": [{ "eventType": "player_killed", "count": 2500 }],
  "dailyTrend": [{ "date": "2026-05-02T00:00:00.000Z", "count": 1000 }],
  "period": "7 days"
}
```

---

## System Endpoints

### 1. Metadata Fields

**Endpoint:** `GET /meta/terms`

Returns a list of all distinct `categories` and `event_types` currently existing in the ClickHouse `fiveops.logs` table, allowing the Dashboard to dynamically populate dropdowns.

**Response:**
```json
{
  "categories": ["combat", "vehicle", "inventory"],
  "eventTypes": ["player_killed", "player_died", "item_swapped"]
}
```

### 2. Health

**Endpoint:** `GET /health`

Quick ping to check if the Node service is alive.
