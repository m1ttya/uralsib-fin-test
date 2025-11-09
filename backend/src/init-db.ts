import { query, useSQLite } from './db';
import fs from 'fs/promises';
import path from 'path';

export async function initDatabase() {
  try {
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);

    // Sort migration files numerically
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    // Execute each migration
    for (const file of migrationFiles) {
      // Skip PostgreSQL-specific migrations in SQLite
      if (useSQLite && file.includes('trigger')) {
        console.log(`Skipping PostgreSQL trigger migration: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      console.log(`Executing migration: ${file}`);
      await query(sql);
      console.log(`Migration completed: ${file}`);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
