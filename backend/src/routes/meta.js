const express = require('express');
const { client, qualifiedTable } = require('../clickhouse/client');

const router = express.Router();

router.get('/meta/terms', async (req, res) => {
  try {
    const sizeRaw = parseInt(req.query.size, 10);
    const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 1000) : 200;
    const table = qualifiedTable();

    const categoriesQuery = `
      SELECT DISTINCT category AS value
      FROM ${table}
      WHERE category != ''
      LIMIT {size:UInt32}
    `;
    const eventTypesQuery = `
      SELECT DISTINCT event_type AS value
      FROM ${table}
      WHERE event_type != ''
      LIMIT {size:UInt32}
    `;

    const [catRes, evRes] = await Promise.all([
      client.query({ query: categoriesQuery, query_params: { size }, format: 'JSONEachRow' }),
      client.query({ query: eventTypesQuery, query_params: { size }, format: 'JSONEachRow' })
    ]);

    const [catRows, evRows] = await Promise.all([catRes.json(), evRes.json()]);

    res.json({
      categories: catRows.map(r => r.value),
      eventTypes: evRows.map(r => r.value)
    });
  } catch (error) {
    console.error('Error fetching meta terms:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
