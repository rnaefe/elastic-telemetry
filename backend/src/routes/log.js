const express = require('express');
const { client, qualifiedTable } = require('../clickhouse/client');
const { normalizeLog } = require('../clickhouse/normalizeLog');

const router = express.Router();

router.post('/log', async (req, res) => {
  try {
    const row = normalizeLog(req.body || {});

    await client.insert({
      table: qualifiedTable(),
      values: [row],
      format: 'JSONEachRow'
    });

    res.status(201).json({ ok: true, id: row.id });
  } catch (error) {
    if (error && error.code === 'MISSING_EVENT_TYPE') {
      return res.status(400).json({ error: 'Missing event_type' });
    }
    console.error('Error inserting log:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.post('/logs/bulk', async (req, res) => {
  try {
    const body = req.body;
    const entries = Array.isArray(body) ? body : (body && Array.isArray(body.logs) ? body.logs : null);

    if (!entries) {
      return res.status(400).json({ error: 'Body must be an array or { logs: [...] }' });
    }
    if (entries.length === 0) {
      return res.json({ ok: true, inserted: 0 });
    }

    const rows = [];
    for (let i = 0; i < entries.length; i++) {
      try {
        rows.push(normalizeLog(entries[i]));
      } catch (e) {
        if (e.code === 'MISSING_EVENT_TYPE') {
          return res.status(400).json({ error: 'Missing event_type', index: i });
        }
        return res.status(400).json({ error: e.message, index: i });
      }
    }

    await client.insert({
      table: qualifiedTable(),
      values: rows,
      format: 'JSONEachRow'
    });

    res.status(201).json({ ok: true, inserted: rows.length });
  } catch (error) {
    console.error('Error bulk inserting logs:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
