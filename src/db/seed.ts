import { pool, testConnection, closePool } from './config';
import { permissionRepository } from '../repositories';

async function seed() {
  console.log('Starting database seeding...');

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Seed permissions
    console.log('Seeding permissions...');
    const insertedCount = await permissionRepository.seed();
    console.log(`Inserted ${insertedCount} permissions`);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };
