// scripts/run_07_migration.js
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

const sqlPath = path.join(__dirname, '07_credit_event_triggers_and_rpcs.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 07: Credit Event Triggers, Bonus RPCs & Escrow Locks...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 07 executed successfully!');

    // Check count of signup bonuses credited
    const { rows: [bCount] } = await client.query(`
      SELECT COUNT(*) FROM public.wallet_transactions WHERE type = 'signup_bonus';
    `);
    console.log(`🎁 Total clients credited with 1,500 signup bonus: ${bCount.count}`);

  } catch (err) {
    console.error('❌ Migration 07 failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
