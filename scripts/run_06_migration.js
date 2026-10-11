// scripts/run_06_migration.js
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

const sqlPath = path.join(__dirname, '06_credit_system_and_wallets.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('🚀 Running Migration 06: Credit & Escrow System, Wallets & Payment Slips...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration 06 executed successfully!');

    // Create payment-slips bucket in storage.buckets
    console.log('🪣 Setting up payment-slips storage bucket...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('payment-slips', 'payment-slips', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      DROP POLICY IF EXISTS "Authenticated users can upload payment slips" ON storage.objects;
      CREATE POLICY "Authenticated users can upload payment slips"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK ( bucket_id = 'payment-slips' );

      DROP POLICY IF EXISTS "Anyone can view payment slips" ON storage.objects;
      CREATE POLICY "Anyone can view payment slips"
        ON storage.objects FOR SELECT TO authenticated, anon
        USING ( bucket_id = 'payment-slips' );
    `);
    console.log('✅ payment-slips storage bucket and policies created!');

    // Verify wallets table
    const { rows: walletCols } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);
    console.log(`📋 wallets table columns (${walletCols.length}):`);
    walletCols.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

    // Verify count of initialized wallets
    const { rows: [wCount] } = await client.query(`SELECT COUNT(*) FROM public.wallets;`);
    console.log(`💼 Total initialized wallets: ${wCount.count}`);

  } catch (err) {
    console.error('❌ Migration 06 failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
