import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration for PostgreSQL connection pool
 * Supports both DATABASE_URL (cloud) and individual connection params (local)
 */
export const dbConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for most cloud providers
      },
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for cloud latency
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'patient_portal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

/**
 * PostgreSQL connection pool instance
 * Provides connection pooling for efficient database access
 */
export const pool = new Pool(dbConfig);

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    const dbType = process.env.DATABASE_URL ? 'cloud' : 'local';
    console.log(`Database connection successful (${dbType})`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close all database connections
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}
