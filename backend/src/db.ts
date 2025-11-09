import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

const useSQLite = process.env.USE_SQLITE === 'true';

// SQLite setup
let sqliteDb: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// PostgreSQL setup
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'uralsib_user',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  database: process.env.DB_NAME || 'uralsib_financial',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize SQLite database
async function initSQLite() {
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || './uralsib_financial.db';
    sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await sqliteDb.run('PRAGMA foreign_keys = ON');
  }
  return sqliteDb;
}

// Query function that works with both databases
export const query = async (text: string, params?: any[]) => {
  if (useSQLite) {
    const db = await initSQLite();

    // Convert PostgreSQL-specific syntax to SQLite
    let sqliteQuery = text;
    const sqliteParams = [...(params || [])];

    // Convert RETURNING clause to SELECT (SQLite doesn't support RETURNING)
    const returningMatch = sqliteQuery.match(/RETURNING\s+(.+?)(;|$)/i);
    if (returningMatch) {
      console.log('=== DEBUG: Converting RETURNING ===');
      console.log('Original query:', text);
      console.log('Returning match:', returningMatch[0]);
      const columns = returningMatch[1];
      sqliteQuery = sqliteQuery.replace(/\s*RETURNING\s+[\s\S]*$/i, '');
      console.log('After removing RETURNING:', sqliteQuery);

      // Execute the query and then select the returned columns
      await db.run(sqliteQuery, sqliteParams);

      // For INSERT operations, get the last inserted row
      if (sqliteQuery.trim().toUpperCase().startsWith('INSERT')) {
        const tableMatch = sqliteQuery.match(/INSERT\s+INTO\s+(\w+)\s*(\(|;|\s)/i);
        const tableName = tableMatch ? tableMatch[1] : 'users';
        console.log('Extracted table name:', tableName);
        const result = await db.get(`SELECT * FROM ${tableName} WHERE rowid = last_insert_rowid()`);
        console.log('Result:', result);
        return { rows: [result] };
      }

      // For UPDATE/DELETE, return empty array
      return { rows: [] };
    }

    // Convert SERIAL to AUTOINCREMENT
    sqliteQuery = sqliteQuery.replace(/SERIAL\s+PRIMARY\s+KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');

    // Convert timestamp functions
    sqliteQuery = sqliteQuery.replace(/NOW\(\)/g, "datetime('now')");
    sqliteQuery = sqliteQuery.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");

    // Execute query
    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sqliteQuery, sqliteParams);
      return { rows };
    } else {
      const result = await db.run(sqliteQuery, sqliteParams);
      return { rows: [] };
    }
  } else {
    // Use PostgreSQL
    return pool.query(text, params);
  }
};

export const getPool = () => useSQLite ? null : pool;
export const getSQLiteDb = () => sqliteDb;
export default useSQLite ? null : pool;

export interface User {
  user_id: number;
  email: string | null;
  username: string | null;
  password_hash: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestResult {
  result_id: number;
  user_id: number;
  test_id: string;
  test_title: string | null;
  test_category: string | null;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  started_at: Date;
  completed_at: Date | null;
  is_completed: boolean;
  answers: any;
}

export interface UserCourse {
  course_id: number;
  user_id: number;
  course_name: string;
  course_category: string | null;
  enrolled_at: Date;
  progress_percentage: number;
  last_accessed_at: Date | null;
  is_active: boolean;
}
