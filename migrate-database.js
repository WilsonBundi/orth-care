/**
 * Database Migration Helper Script
 * This script helps migrate your database schema to a cloud database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL not found in .env file');
    console.log('\n📝 Please add your Neon connection string to .env file:');
    console.log('DATABASE_URL=postgresql://username:password@host/database?sslmode=require');
    process.exit(1);
  }

  console.log('🚀 Starting database migration...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to cloud database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read schema files
    const schemaFiles = [
      'src/db/schema.sql',
      'src/db/schema_enterprise.sql',
      'src/db/invoices_schema.sql'
    ];

    // Execute each schema file
    for (const file of schemaFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (file not found)`);
        continue;
      }

      console.log(`📄 Running ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📊 Verifying tables...');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n✅ Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ Your cloud database is ready to use!');
    console.log('🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your DATABASE_URL in .env file');
    console.log('   2. Ensure your connection string includes ?sslmode=require');
    console.log('   3. Verify your database credentials are correct');
    console.log('   4. Check if your IP is whitelisted (if required)');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
migrateDatabase();
