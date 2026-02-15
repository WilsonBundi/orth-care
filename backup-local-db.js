/**
 * Local Database Backup Script
 * Run this BEFORE migrating to cloud if you have data you want to keep
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  console.log('📦 Starting local database backup...\n');

  // Local database configuration
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'patient_portal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
  });

  try {
    await client.connect();
    console.log('✅ Connected to local database\n');

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    let backupSQL = `-- Database Backup: ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${process.env.DB_NAME || 'patient_portal'}\n\n`;

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Found tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // Backup each table
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`💾 Backing up ${tableName}...`);

      // Get table data
      const dataResult = await client.query(`SELECT * FROM ${tableName}`);
      
      if (dataResult.rows.length > 0) {
        backupSQL += `-- Table: ${tableName}\n`;
        backupSQL += `-- Records: ${dataResult.rows.length}\n\n`;

        // Get column names
        const columns = Object.keys(dataResult.rows[0]);
        
        for (const record of dataResult.rows) {
          const values = columns.map(col => {
            const val = record[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });

          backupSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        backupSQL += '\n';
      } else {
        console.log(`   ⚠️  No data in ${tableName}`);
      }
    }

    // Write backup file
    fs.writeFileSync(backupFile, backupSQL);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);

    console.log('💡 To restore this backup to your cloud database:');
    console.log('   1. Update .env with your cloud DATABASE_URL');
    console.log('   2. Run: npm run migrate:cloud');
    console.log(`   3. Run: psql "$DATABASE_URL" -f "${backupFile}"\n`);

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    console.log('\n💡 This is OK if you have no local database or no data to backup.');
    console.log('   You can proceed with cloud migration without backup.\n');
  } finally {
    await client.end();
  }
}

// Run backup
backupDatabase();
