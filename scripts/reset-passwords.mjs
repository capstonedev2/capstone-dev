import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import pg from 'pg';

config();

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in .env.');
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
    },
  });

  try {
    const passwordHash = await bcrypt.hash('Password123', 12);
    const result = await pool.query('UPDATE "User" SET "passwordHash" = $1', [passwordHash]);
    console.log(`Successfully updated passwords for ${result.rowCount} users to 'Password123'`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
