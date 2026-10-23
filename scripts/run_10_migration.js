// scripts/run_10_migration.js
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

const sqlPath = path.join(__dirname, '10_security_hardening_rls.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 10: Applying comprehensive RLS security hardening...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 10 executed successfully!');

    // Verify policies
    const { rows } = await client.query(`
      SELECT schemaname, tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' 
        AND tablename IN ('children', 'client_profiles', 'contracts', 'escrow_contracts', 'notifications')
      ORDER BY tablename, policyname;
    `);

    console.log('\n📋 Active RLS Policies after Migration 10:');
    rows.forEach(r => {
      console.log(`  - [${r.tablename}] (${r.cmd}): ${r.policyname}`);
    });

  } catch (err) {
    console.error('❌ Migration 10 failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
