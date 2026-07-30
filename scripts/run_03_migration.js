// scripts/run_03_migration.js
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

const sqlPath = path.join(__dirname, '03_contracts_and_chat_system.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 03: Creating contracts table, chat schema upgrades & storage...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 03 executed successfully!');

    // Verify contracts table exists
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      ORDER BY ordinal_position;
    `);
    console.log(`📋 contracts table columns (${rows.length}):`);
    rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error('❌ Migration 03 failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
