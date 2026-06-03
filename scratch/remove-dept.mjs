import pg from 'pg';
import { config } from 'dotenv';
config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query('UPDATE "User" SET department = NULL WHERE email = $1', ['admin@thesistrack.edu'])
  .then(() => {
    console.log('Department removed from admin@thesistrack.edu');
    pool.end();
  })
  .catch(e => {
    console.error(e.message);
    pool.end();
  });
