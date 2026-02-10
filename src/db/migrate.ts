import { pool, testConnection, closePool } from './config';
import fs from 'fs';
import path from 'path';

/**
 * Run database migrations
 * Applies the schema.sql file to create all tables and indexes
 */
async function migrate(): Promise<void> {
  console.log('Starting database migration...');

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('Applying database schema...');
    await pool.query(schema);

    console.log('Migration completed successfully!');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - sessions');
    console.log('  - audit_events');
    console.log('  - permissions');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { migrate };
