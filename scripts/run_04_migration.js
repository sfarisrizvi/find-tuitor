// scripts/run_04_migration.js
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

const sqlPath = path.join(__dirname, '04_fix_rls_and_permissions.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 04: Fixing contracts, children, and notifications RLS policies...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 04 executed successfully!');
  } catch (err) {
    console.error('❌ Migration 04 failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
