const pg = require('pg');
require('dotenv').config();

let dbConfig;

// Use DATABASE_URL if provided (for Render deployment)
if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Use individual env vars (for local development)
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const db = new pg.Pool(dbConfig);

db.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = { db };
