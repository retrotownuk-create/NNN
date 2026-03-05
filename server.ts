import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
app.use(cors());
// Increase the payload size limit for express.json() if the data is bulky, to prevent PayloadTooLargeError
app.use(express.json({ limit: '50mb' }));

const db = new Database('local-data.db');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS site_data (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/api/sync-orders', (req, res) => {
    try {
        const row = db.prepare('SELECT value FROM site_data WHERE key = ?').get('orders') as { value: string } | undefined;
        res.json(row ? JSON.parse(row.value) : []);
    } catch (err: any) {
        console.error('DATABASE_ERROR:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.post('/api/sync-orders', (req, res) => {
    try {
        const data = req.body || [];
        const stmt = db.prepare(`
            INSERT INTO site_data (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `);
        // ON CONFLICT (key) DO UPDATE requires either SQLite 3.24+ which better-sqlite3 uses.
        // The excluded.value refers to the new insert value.
        stmt.run('orders', JSON.stringify(data));

        res.json({ success: true });
    } catch (err: any) {
        console.error('DATABASE_ERROR:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Local Express API server running on http://localhost:${PORT}`);
});
