const { createClient } = require('@clickhouse/client');

const DATABASE = process.env.CLICKHOUSE_DATABASE || 'fiveops';
const LOGS_TABLE = process.env.CLICKHOUSE_LOGS_TABLE || 'logs';

// Intentionally do NOT set `database` here — bootstrap needs to issue
// CREATE DATABASE before the database exists, and all queries qualify the
// table name explicitly via qualifiedTable().
const config = {
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  request_timeout: parseInt(process.env.CLICKHOUSE_REQUEST_TIMEOUT_MS, 10) || 30000,
  clickhouse_settings: {
    date_time_input_format: 'best_effort'
  }
};

const client = createClient(config);

function qualifiedTable() {
  return `${DATABASE}.${LOGS_TABLE}`;
}

module.exports = {
  client,
  DATABASE,
  LOGS_TABLE,
  qualifiedTable
};
