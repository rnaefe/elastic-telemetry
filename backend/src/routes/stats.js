const express = require('express');
const { client, qualifiedTable } = require('../clickhouse/client');

const router = express.Router();

function clampInt(v, fallback, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  if (n > max) return max;
  return n;
}

async function queryRows(query, query_params) {
  const rs = await client.query({ query, query_params, format: 'JSONEachRow' });
  return rs.json();
}

router.get('/stats/weapons', async (req, res) => {
  try {
    const { server_id } = req.query;
    if (!server_id) {
      return res.status(400).json({ error: 'server_id is required' });
    }

    const days = clampInt(req.query.days, 7, 1, 365);
    const limit = clampInt(req.query.limit, 10, 1, 100);
    const table = qualifiedTable();

    const query = `
      SELECT
        JSONExtractString(payload_json, 'weaponName') AS name,
        count() AS total,
        countIf(event_type = 'player_killed') AS kills,
        countIf(event_type = 'player_died') AS deaths
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND category = 'combat'
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY name
      HAVING name != ''
      ORDER BY total DESC
      LIMIT {limit:UInt32}
    `;

    const rows = await queryRows(query, { server_id: String(server_id), days, limit });

    const weapons = rows.map(r => ({
      name: r.name,
      total: Number(r.total),
      kills: Number(r.kills),
      deaths: Number(r.deaths)
    }));

    const total = weapons.reduce((acc, w) => acc + w.total, 0);

    res.json({ weapons, total, period: `${days} days` });
  } catch (error) {
    console.error('Error fetching weapon stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.get('/stats/vehicles', async (req, res) => {
  try {
    const { server_id } = req.query;
    if (!server_id) {
      return res.status(400).json({ error: 'server_id is required' });
    }

    const days = clampInt(req.query.days, 7, 1, 365);
    const limit = clampInt(req.query.limit, 10, 1, 100);
    const table = qualifiedTable();

    const query = `
      SELECT
        JSONExtractString(payload_json, 'vehicleName') AS name,
        count() AS count
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND category = 'vehicle'
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY name
      HAVING name != ''
      ORDER BY count DESC
      LIMIT {limit:UInt32}
    `;

    const rows = await queryRows(query, { server_id: String(server_id), days, limit });

    const vehicles = rows.map(r => ({ name: r.name, count: Number(r.count) }));
    const total = vehicles.reduce((acc, v) => acc + v.count, 0);

    res.json({ vehicles, total, period: `${days} days` });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { server_id } = req.query;
    if (!server_id) {
      return res.status(400).json({ error: 'server_id is required' });
    }

    const days = clampInt(req.query.days, 7, 1, 365);
    const table = qualifiedTable();
    const params = { server_id: String(server_id), days };

    const totalsQuery = `
      SELECT
        count() AS total,
        countIf(toDate(timestamp) = today()) AS today,
        uniqExact(player_license) AS uniquePlayers
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
    `;

    const byCategoryQuery = `
      SELECT category, count() AS count
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY category
      ORDER BY count DESC
      LIMIT 20
    `;

    const byEventTypeQuery = `
      SELECT event_type AS eventType, count() AS count
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 50
    `;

    const dailyTrendQuery = `
      SELECT
        formatDateTime(toDate(timestamp), '%Y-%m-%dT00:00:00.000Z', 'UTC') AS date,
        count() AS count
      FROM ${table}
      WHERE server_id = {server_id:String}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY toDate(timestamp)
      ORDER BY toDate(timestamp) ASC
    `;

    const [totalsRows, categoryRows, eventTypeRows, dailyRows] = await Promise.all([
      queryRows(totalsQuery, params),
      queryRows(byCategoryQuery, params),
      queryRows(byEventTypeQuery, params),
      queryRows(dailyTrendQuery, params)
    ]);

    const totals = totalsRows[0] || { total: 0, today: 0, uniquePlayers: 0 };

    res.json({
      total: Number(totals.total),
      today: Number(totals.today),
      uniquePlayers: Number(totals.uniquePlayers),
      byCategory: categoryRows.map(r => ({ category: r.category, count: Number(r.count) })),
      byEventType: eventTypeRows.map(r => ({ eventType: r.eventType, count: Number(r.count) })),
      dailyTrend: dailyRows.map(r => ({ date: r.date, count: Number(r.count) })),
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
