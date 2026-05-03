const express = require('express');
const { client, qualifiedTable } = require('../clickhouse/client');

const router = express.Router();

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

function safeJsonParse(s) {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function toIsoUtc(chTimestamp) {
  if (!chTimestamp) return null;
  // ClickHouse returns DateTime64(3) as 'YYYY-MM-DD HH:MM:SS.sss' (UTC).
  // Convert to dashboard-compatible ISO 8601 with millisecond precision.
  const s = String(chTimestamp).replace(' ', 'T');
  if (s.endsWith('Z')) return s;
  return s + 'Z';
}

function clampInt(v, fallback, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  if (n > max) return max;
  return n;
}

function csvList(v) {
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

router.get('/search', async (req, res) => {
  try {
    const {
      license,
      event_type,
      event_types,
      category,
      categories,
      q,
      player_name,
      server_name,
      server_id,
      isDevServer,
      date_from,
      date_to
    } = req.query;

    const page = clampInt(req.query.page, 1, 1, 1_000_000);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const where = [];
    const params = {};

    if (license) {
      where.push('player_license = {license:String}');
      params.license = String(license);
    }

    if (event_type) {
      where.push('event_type = {event_type:String}');
      params.event_type = String(event_type);
    } else if (event_types) {
      const list = csvList(event_types);
      if (list.length > 0) {
        where.push('event_type IN {event_types:Array(String)}');
        params.event_types = list;
      }
    }

    if (category) {
      where.push('category = {category:String}');
      params.category = String(category);
    } else if (categories) {
      const list = csvList(categories);
      if (list.length > 0) {
        where.push('category IN {categories:Array(String)}');
        params.categories = list;
      }
    }

    if (player_name) {
      where.push('positionCaseInsensitive(player_name, {player_name:String}) > 0');
      params.player_name = String(player_name);
    }

    if (server_id) {
      where.push('server_id = {server_id:String}');
      params.server_id = String(server_id);
    }

    if (server_name) {
      where.push('positionCaseInsensitive(server_name, {server_name:String}) > 0');
      params.server_name = String(server_name);
    }

    if (isDevServer !== undefined && isDevServer !== '') {
      where.push('is_dev_server = {is_dev_server:Bool}');
      params.is_dev_server = isDevServer === 'true' || isDevServer === true;
    }

    if (date_from) {
      where.push('timestamp >= parseDateTime64BestEffort({date_from:String}, 3, \'UTC\')');
      params.date_from = String(date_from);
    }
    if (date_to) {
      where.push('timestamp <= parseDateTime64BestEffort({date_to:String}, 3, \'UTC\')');
      params.date_to = String(date_to);
    }

    if (q) {
      where.push(`(
        positionCaseInsensitive(player_name, {q:String}) > 0
        OR positionCaseInsensitive(server_name, {q:String}) > 0
        OR positionCaseInsensitive(event_type, {q:String}) > 0
        OR positionCaseInsensitive(category, {q:String}) > 0
        OR positionCaseInsensitive(message, {q:String}) > 0
        OR positionCaseInsensitive(resource_name, {q:String}) > 0
        OR positionCaseInsensitive(payload_json, {q:String}) > 0
      )`);
      params.q = String(q);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const table = qualifiedTable();

    const dataQuery = `
      SELECT
        toString(id) AS id,
        timestamp,
        server_id,
        server_name,
        is_dev_server,
        category,
        event_type,
        player_license,
        player_name,
        player_source,
        message,
        resource_name,
        payload_json
      FROM ${table}
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;

    const countQuery = `SELECT count() AS total FROM ${table} ${whereClause}`;

    const [dataRes, countRes] = await Promise.all([
      client.query({
        query: dataQuery,
        query_params: { ...params, limit, offset },
        format: 'JSONEachRow'
      }),
      client.query({
        query: countQuery,
        query_params: params,
        format: 'JSONEachRow'
      })
    ]);

    const rows = await dataRes.json();
    const countRows = await countRes.json();
    const total = countRows.length > 0 ? Number(countRows[0].total) : 0;

    const items = rows.map(row => ({
      _id: row.id,
      _source: {
        '@timestamp': toIsoUtc(row.timestamp),
        server: { id: row.server_id, name: row.server_name },
        isDevServer: Boolean(row.is_dev_server),
        category: row.category,
        event_type: row.event_type,
        player: {
          name: row.player_name,
          source: row.player_source === null || row.player_source === undefined
            ? null
            : Number(row.player_source),
          identifiers: { license: row.player_license }
        },
        payload: safeJsonParse(row.payload_json),
        message: row.message,
        resourceName: row.resource_name
      }
    }));

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
