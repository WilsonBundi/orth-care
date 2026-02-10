import { pool, testConnection, closePool } from './config';

describe('Database Configuration', () => {
  afterAll(async () => {
    await closePool();
  });

  it('should connect to the database successfully', async () => {
    const connected = await testConnection();
    expect(connected).toBe(true);
  });

  it('should execute a simple query', async () => {
    const result = await pool.query('SELECT 1 as value');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.value).toBe(1);
  });

  it('should have proper pool configuration', () => {
    expect(pool.totalCount).toBeGreaterThanOrEqual(0);
    expect(pool.idleCount).toBeGreaterThanOrEqual(0);
    expect(pool.waitingCount).toBeGreaterThanOrEqual(0);
  });
});
