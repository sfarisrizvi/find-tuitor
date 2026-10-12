// scripts/run_09_migration.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
  });
}

const connectionString = env['DATABASE_URL'] || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '09_contract_reviews_and_reputation.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 09: Verified Contract Reviews & Reputation System...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 09 executed successfully!');

    // Verify contract_reviews table
    const { rows: reviewCols } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contract_reviews' 
      ORDER BY ordinal_position;
    `);
    console.log(`📋 contract_reviews table columns (${reviewCols.length}):`);
    reviewCols.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

    // Verify trigger existence
    const { rows: trigRows } = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'contract_reviews';
    `);
    console.log(`⚡ Triggers active on contract_reviews:`, trigRows.map(t => t.trigger_name));

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
