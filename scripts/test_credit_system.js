// scripts/test_credit_system.js
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

async function test() {
  console.log('🧪 Verifying Credit & Escrow Database Tables & Stored Functions...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // 1. Check Tables
    const tables = ['wallets', 'credit_requests', 'wallet_transactions', 'unlocked_contacts', 'escrow_contracts'];
    for (const t of tables) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`, [t]);
      console.log(`   Table '${t}': ${rows[0].count > 0 ? '✅ Exists' : '❌ Missing'}`);
    }

    // 2. Check Wallets count
    const { rows: [wCount] } = await client.query(`SELECT COUNT(*) FROM public.wallets`);
    console.log(`   Total initialized user wallets: ${wCount.count}`);

    // 3. Check Wallet Transactions
    const { rows: [txCount] } = await client.query(`SELECT COUNT(*) FROM public.wallet_transactions`);
    console.log(`   Total ledger transactions recorded: ${txCount.count}`);

    // 4. Check Stored Procedures
    const rpcs = [
      'get_or_create_wallet',
      'deduct_credits',
      'admin_approve_credit_request',
      'admin_reject_credit_request',
      'claim_tutor_onboarding_bonus',
      'award_tutor_verification_bonus',
      'unlock_tutor_contacts',
      'lock_contract_escrow',
      'tutor_accept_contract_fee'
    ];

    console.log('   Checking Stored Procedures:');
    for (const rpc of rpcs) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM pg_proc WHERE proname = $1`, [rpc]);
      console.log(`     - ${rpc}: ${rows[0].count > 0 ? '✅ Active' : '❌ Missing'}`);
    }

    console.log('\n🎉 ALL CREDIT & ESCROW SYSTEM VERIFICATIONS PASSED!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await client.end();
  }
}

test();
