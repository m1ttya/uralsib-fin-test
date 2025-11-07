const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function initDatabase() {
  console.log('Initializing SQLite database...');

  const db = await open({
    filename: './uralsib_financial.db',
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Create users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users(
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE,
      username VARCHAR(50) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes
  await db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');

  // Create refresh_tokens table
  await db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens(
      token_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  await db.run('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)');

  // Create test_results table
  await db.run(`
    CREATE TABLE IF NOT EXISTS test_results(
      result_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      test_id TEXT NOT NULL,
      test_title TEXT,
      test_category TEXT,
      percentage REAL NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      is_completed INTEGER DEFAULT 0,
      answers TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  await db.run('CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id)');

  // Create user_courses table
  await db.run(`
    CREATE TABLE IF NOT EXISTS user_courses(
      course_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_name TEXT NOT NULL,
      course_category TEXT,
      enrolled_at TEXT NOT NULL,
      progress_percentage REAL DEFAULT 0,
      last_accessed_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  await db.run('CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id)');

  await db.close();
  console.log('✅ Database initialized successfully!');
  console.log('Database file: uralsib_financial.db');
}

initDatabase().catch(err => {
  console.error('❌ Error initializing database:', err);
  process.exit(1);
});
