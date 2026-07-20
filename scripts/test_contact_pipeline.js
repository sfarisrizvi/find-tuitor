// Test the full pipeline end-to-end using the Supabase JS client (same as the app):
// 1. Insert a row as anon (simulating contact form — no auth)
// 2. Read rows as admin (simulating admin dashboard)

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = 'https://qlhcavfyllfcwifxbtbu.supabase.co';
const ANON_KEY = 'sb_publishable_uHFkvvIt2_P_Hd-InbQkOw_qTdWml0Q';
const DATABASE_URL = "postgresql://postgres.qlhcavfyllfcwifxbtbu:2Xy8IkpeFkVOE6qf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function test() {
  console.log('\n=== Step 1: INSERT via anon client (contact form simulation) ===\n');

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: insertData, error: insertError } = await anonClient
    .from('contact_queries')
    .insert({
      name: 'E2E Test User',
      email: 'e2e-test@tutoronline.local',
      phone: '03001234567',
      role: 'parent_student',
      message: 'End-to-end pipeline test from contact form simulation.',
      status: 'pending'
    })
    .select();

  if (insertError) {
    console.error('❌ INSERT failed (anon):', insertError.message);
    console.error('   Code:', insertError.code);
    return;
  }
  console.log('✅ INSERT successful as anon user:');
  console.log('   Row ID:', insertData?.[0]?.id);

  console.log('\n=== Step 2: SELECT via direct DB (simulating admin read) ===\n');

  const pgClient = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();
  const rows = await pgClient.query('SELECT id, name, email, status, created_at FROM public.contact_queries ORDER BY created_at DESC LIMIT 5');
  
  console.log(`✅ Total rows visible via direct DB: ${rows.rows.length}`);
  rows.rows.forEach((r,i) => console.log(`   ${i+1}. [${r.status}] ${r.name} <${r.email}>`));

  await pgClient.end();
  console.log('\n=== Pipeline test complete ===\n');
}

test().catch(console.error);
