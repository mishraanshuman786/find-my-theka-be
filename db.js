const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        radius INTEGER DEFAULT 5000,
        results_count INTEGER DEFAULT 0,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
    `);

    console.log('✅ Database tables created/verified');
  } finally {
    client.release();
  }
}

// User functions
async function createUser(name, email, password, phone = null) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, created_at',
    [name, email, hashedPassword, phone]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password, phone, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function verifyUserPassword(hashedPassword, plainPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Search history functions
async function saveSearchHistory(userId, lat, lng, radius, resultsCount) {
  await pool.query(
    'INSERT INTO search_history (user_id, latitude, longitude, radius, results_count) VALUES ($1, $2, $3, $4, $5)',
    [userId, lat, lng, radius, resultsCount]
  );
}

async function getUserSearchHistory(userId, limit = 10) {
  const result = await pool.query(
    'SELECT * FROM search_history WHERE user_id = $1 ORDER BY searched_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

module.exports = {
  pool,
  initDatabase,
  createUser,
  findUserByEmail,
  verifyUserPassword,
  saveSearchHistory,
  getUserSearchHistory
};
