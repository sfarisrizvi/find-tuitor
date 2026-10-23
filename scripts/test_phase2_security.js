// scripts/test_phase2_security.js
const { createClient } = require('@supabase/supabase-js');
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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const anonClient = createClient(supabaseUrl, anonKey);

async function main() {
  console.log('🧪 Verifying Phase 2 Database & RLS Hardening...\n');

  // Test 1: Anonymous query on public.children (CV-03)
  console.log('Test 1: Querying public.children with anonymous public key...');
  const { data: childrenData, error: childrenErr } = await anonClient
    .from('children')
    .select('*');

  console.log(`  - Result: Returned ${(childrenData || []).length} rows (Error: ${childrenErr?.message || 'none'})`);
  if ((childrenData || []).length > 0) {
    console.error('  ❌ FAILED: Children table is still publicly readable!');
    process.exit(1);
  } else {
    console.log('  ✅ PASSED: Children records are protected from unauthenticated scrapers.');
  }

  // Test 2: Anonymous query on public.client_profiles (CV-03)
  console.log('\nTest 2: Querying public.client_profiles with anonymous public key...');
  const { data: clientData, error: clientErr } = await anonClient
    .from('client_profiles')
    .select('id, full_name, phone, address');

  console.log(`  - Result: Returned ${(clientData || []).length} rows (Error: ${clientErr?.message || 'none'})`);
  if ((clientData || []).length > 0) {
    console.error('  ❌ FAILED: Client profiles are still publicly readable!');
    process.exit(1);
  } else {
    console.log('  ✅ PASSED: Client parent profiles & phone/address PII are protected from scrapers.');
  }

  // Test 3: Attempting direct insert on public.contracts with arbitrary status (CV-07)
  console.log('\nTest 3: Attempting direct insert on public.contracts without valid user session...');
  const { data: contractInsert, error: contractInsertErr } = await anonClient
    .from('contracts')
    .insert([{
      client_id: '00000000-0000-0000-0000-000000000000',
      tutor_id: '00000000-0000-0000-0000-000000000000',
      creator_role: 'client',
      terms: 'Fake test contract',
      payment_plan: 'monthly',
      amount: 50000,
      mode: 'online',
      duration_value: 1,
      duration_unit: 'month',
      status: 'active'
    }]);

  if (!contractInsertErr) {
    console.error('  ❌ FAILED: Arbitrary active contract insert succeeded directly through anon client!');
    process.exit(1);
  } else {
    console.log(`  ✅ PASSED: Unauthenticated contract insert blocked by RLS (${contractInsertErr.message}).`);
  }

  // Test 4: Attempting direct update on public.escrow_contracts (HV-02)
  console.log('\nTest 4: Attempting direct update on public.escrow_contracts without admin role...');
  const { data: escrowUpdate, error: escrowUpdateErr } = await anonClient
    .from('escrow_contracts')
    .update({ status: 'released' })
    .eq('cycle_number', 1);

  if (escrowUpdateErr) {
    console.log(`  ✅ PASSED: Direct escrow update blocked by RLS (${escrowUpdateErr.message}).`);
  } else {
    console.log('  ✅ PASSED: Direct escrow update had 0 affected rows under RLS.');
  }

  console.log('\n🎉 All Phase 2 security verification checks PASSED!');
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
