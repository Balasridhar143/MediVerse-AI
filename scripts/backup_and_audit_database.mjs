import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

async function queryWithRetry(queryFn, maxRetries = 4, delayMs = 600) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }
}

async function main() {
  console.log('=== Step 1: Performing Safe Database Audit & Non-Destructive Backup ===\n');

  const getClient = () => neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

  // Query all public tables
  const tablesRes = await queryWithRetry(() => getClient()`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  const tables = tablesRes.map((r) => r.table_name);
  console.log(`Found ${tables.length} tables in PostgreSQL database:`);
  console.log(tables.join(', ') + '\n');

  const backupData = {
    timestamp: new Date().toISOString(),
    database_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'N/A',
    table_counts: {},
    tables: {},
  };

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const table of tables) {
    try {
      const countRes = await queryWithRetry(() => getClient().query(`SELECT COUNT(*)::int as count FROM "${table}";`));
      const count = countRes[0]?.count || 0;
      backupData.table_counts[table] = count;

      // Extract rows safely for backup
      const rows = await queryWithRetry(() => getClient().query(`SELECT * FROM "${table}";`));
      backupData.tables[table] = rows;
      console.log(`  ✓ Table: ${table.padEnd(30)} | Records: ${String(count).padStart(6)}`);
    } catch (err) {
      console.error(`  ✗ Error querying table ${table}: ${err.message}`);
    }
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `db_backup_${timestampStr}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n✓ Full database backup safely written to: ${backupFilePath}`);
  console.log(`✓ Total tables backed up: ${Object.keys(backupData.tables).length}`);
  const totalRecords = Object.values(backupData.table_counts).reduce((a, b) => a + b, 0);
  console.log(`✓ Total records safely preserved: ${totalRecords}`);
}

main().catch(console.error);
