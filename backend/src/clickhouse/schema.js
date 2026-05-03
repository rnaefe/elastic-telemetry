const { DATABASE, LOGS_TABLE } = require('./client');

function getRetentionDays() {
  const raw = parseInt(process.env.LOG_RETENTION_DAYS, 10);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 90;
}

const createDatabase = `CREATE DATABASE IF NOT EXISTS ${DATABASE}`;

function createLogsTable() {
  const days = getRetentionDays();
  return `
CREATE TABLE IF NOT EXISTS ${DATABASE}.${LOGS_TABLE}
(
    id              UUID DEFAULT generateUUIDv4(),
    timestamp       DateTime64(3, 'UTC') DEFAULT now64(3),
    server_id       String,
    server_name     LowCardinality(String),
    is_dev_server   Bool DEFAULT false,
    category        LowCardinality(String),
    event_type      LowCardinality(String),
    player_license  String,
    player_name     String,
    player_source   Nullable(UInt32),
    message         String,
    resource_name   String,
    payload_json    String,
    raw_json        String,
    inserted_at     DateTime DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (server_id, timestamp, category, event_type, player_license)
TTL toDateTime(timestamp) + INTERVAL ${days} DAY
`;
}

module.exports = {
  createDatabase,
  createLogsTable,
  getRetentionDays
};
