import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost/arena_rgs'
});

export const query = (text, params) => pool.query(text, params);
