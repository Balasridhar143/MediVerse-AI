import { neon } from '@neondatabase/serverless';

const dbUrl = 'postgresql://neondb_owner:npg_ILe9fG7nqVxk@ep-odd-violet-b8mtt393-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(dbUrl);

async function check() {
  try {
    const res = await sql`SELECT 1 as connected, current_database(), current_user;`;
    console.log('Neon Database Connection SUCCESS:', res);
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`;
    console.log('Tables in Neon:', tables.map(t => t.table_name));
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`;
    console.log('User count in Neon:', userCount[0].count);
  } catch (err) {
    console.error('Neon Connection Error:', err);
  }
}

check();
