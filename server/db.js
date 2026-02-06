import pg from 'pg';

const { Pool } = pg;

const normalizeDbUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch (error) {
    return rawUrl;
  }
};

const rawDbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '';
const connectionString = normalizeDbUrl(rawDbUrl);

if (connectionString) {
  try {
    const safeUrl = new URL(connectionString);
    console.log(`DB host: ${safeUrl.hostname}`);
  } catch (error) {
    console.warn('DB host: (unable to parse DATABASE_URL)');
  }
} else {
  console.warn('DATABASE_URL is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
