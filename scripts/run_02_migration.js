// scripts/run_02_migration.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const connectionString = env['DATABASE_URL'];
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '02_admin_profiles_and_cleanup.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 02: Creating admin_profiles & cleaning legacy archive table...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 02 executed successfully!');

    // Check count of admin_profiles
    const { rows } = await client.query('SELECT COUNT(*) FROM public.admin_profiles');
    console.log(`📊 Total admin_profiles created: ${rows[0].count}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
