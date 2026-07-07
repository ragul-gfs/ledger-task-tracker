const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Local fallback: if no Turso env vars are set, this just writes to a
// local file (useful for testing on your own machine). On Render, set
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN and it uses that instead —
// which is a real permanent database, independent of Render's own disk.
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'ledger.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Get a stored value by key
app.get('/api/data/:key', async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT value FROM kv WHERE key = ?',
      args: [req.params.key],
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json({ value: result.rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

// Save (create or update) a value by key
app.post('/api/data/:key', async (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== 'string') {
    return res.status(400).json({ error: 'value must be a string' });
  }
  try {
    await client.execute({
      sql: `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [req.params.key, value],
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ledger server running on port ${PORT}`);
      console.log(process.env.TURSO_DATABASE_URL
        ? 'Using Turso (remote, permanent database)'
        : `Using local file: ${path.join(DATA_DIR, 'ledger.db')}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

