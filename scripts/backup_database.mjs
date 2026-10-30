import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function backupDatabase() {
  console.log('=== STARTING SECURE DATABASE BACKUP ===');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `mediverse_backup_${timestamp}.json`);

  const tables = [
    'users',
    'patients',
    'doctors',
    'hospital_admins',
    'hospitals',
    'departments',
    'appointments',
    'medical_reports',
    'prescriptions',
    'prescription_items',
    'patient_allergies',
    'doctor_patient_relationships',
    'audit_logs',
    'medical_knowledge'
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  for (const table of tables) {
    try {
      const rows = await sql.query(`SELECT * FROM ${table};`);
      backupData.tables[table] = rows;
      console.log(`✓ Backed up ${table}: ${rows.length} rows`);
    } catch (err) {
      console.warn(`! Table ${table} check: ${err.message}`);
      backupData.tables[table] = [];
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n>>> SECURE BACKUP CREATED AT: ${backupFile} <<<`);
}

backupDatabase().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
