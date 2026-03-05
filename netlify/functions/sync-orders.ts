import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

let isConnected = false;

async function connect() {
    if (!isConnected) {
        await client.connect();
        isConnected = true;

        // Create table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS site_data (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
}

export const handler: Handler = async (event) => {
    if (!process.env.DATABASE_URL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'DATABASE_URL not set' }),
        };
    }

    try {
        await connect();

        if (event.httpMethod === 'GET') {
            const res = await client.query('SELECT value FROM site_data WHERE key = $1', ['orders']);
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows[0]?.value || []),
            };
        }

        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body || '[]');
            await client.query(`
        INSERT INTO site_data (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      `, ['orders', JSON.stringify(data)]);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true }),
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (err: any) {
        console.error('DATABASE_ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message, stack: err.stack }),
        };
    }
};
