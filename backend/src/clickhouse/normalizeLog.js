const { randomUUID } = require('crypto');

function pick(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function normalizeEventType(raw) {
  return (
    raw.event_type ||
    raw.eventType ||
    raw.type ||
    raw.event ||
    (raw.payload && (raw.payload.event_type || raw.payload.eventType)) ||
    null
  );
}

function normalizeTimestamp(raw) {
  const ts = raw['@timestamp'] || raw.timestamp;
  if (!ts) return new Date().toISOString();
  const d = new Date(ts);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function toBool(v) {
  if (v === true || v === false) return v;
  if (v === 'true' || v === 1 || v === '1') return true;
  if (v === 'false' || v === 0 || v === '0') return false;
  return false;
}

function toUInt32OrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function safeStringify(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

function clickhouseTimestamp(iso) {
  // ClickHouse DateTime64(3) accepts 'YYYY-MM-DD HH:MM:SS.sss' (UTC)
  // The ISO 'T' / 'Z' is also accepted with date_time_input_format=best_effort.
  return iso.replace('T', ' ').replace('Z', '');
}

function normalizeLog(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('log entry must be an object');
  }

  const eventType = normalizeEventType(raw);
  if (!eventType) {
    const err = new Error('Missing event_type');
    err.code = 'MISSING_EVENT_TYPE';
    throw err;
  }

  const payload = (raw.payload && typeof raw.payload === 'object') ? raw.payload : {};
  const server = (raw.server && typeof raw.server === 'object') ? raw.server : {};
  const player = (raw.player && typeof raw.player === 'object') ? raw.player : {};
  const identifiers = (player.identifiers && typeof player.identifiers === 'object')
    ? player.identifiers
    : {};

  const isoTimestamp = normalizeTimestamp(raw);

  const row = {
    id: randomUUID(),
    timestamp: clickhouseTimestamp(isoTimestamp),
    server_id: String(pick(server.id, raw.server_id, payload.server_id) || ''),
    server_name: String(pick(server.name, raw.server_name, payload.server_name) || ''),
    is_dev_server: toBool(pick(raw.isDevServer, raw.is_dev_server, server.isDevServer)),
    category: String(pick(raw.category, payload.category) || ''),
    event_type: String(eventType),
    player_license: String(
      pick(identifiers.license, player.license, raw.license, payload.license) || ''
    ),
    player_name: String(pick(player.name, raw.player_name, payload.player_name) || ''),
    player_source: toUInt32OrNull(pick(player.source, raw.source, payload.source)),
    message: String(
      pick(raw.message, payload.message, payload.reason, payload.action) || ''
    ),
    resource_name: String(
      pick(payload.resourceName, raw.resourceName, raw.resource_name) || ''
    ),
    payload_json: safeStringify(payload),
    raw_json: safeStringify({ ...raw, event_type: eventType, '@timestamp': isoTimestamp })
  };

  return row;
}

function normalizeBatch(rawArray) {
  if (!Array.isArray(rawArray)) {
    throw new Error('expected an array of log entries');
  }
  return rawArray.map((entry, i) => {
    try {
      return normalizeLog(entry);
    } catch (e) {
      e.index = i;
      throw e;
    }
  });
}

module.exports = { normalizeLog, normalizeBatch };
