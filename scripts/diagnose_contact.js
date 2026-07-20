// Check what Supabase says about this key / what role it maps to
const SUPABASE_URL = 'https://qlhcavfyllfcwifxbtbu.supabase.co';
const ANON_KEY = 'sb_publishable_uHFkvvIt2_P_Hd-InbQkOw_qTdWml0Q';

async function run() {
  // 1. Test what the key resolves to by calling auth/v1/user
  console.log('=== Testing key against Supabase Auth API ===\n');
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });
  console.log('Auth status:', authRes.status);
  const authBody = await authRes.json();
  console.log('Auth response:', JSON.stringify(authBody, null, 2));

  // 2. Test a simple SELECT (no RLS required from anon if policies allow)
  console.log('\n=== Testing GET (SELECT) on contact_queries with anon key ===\n');
  const getRes = await fetch(`${SUPABASE_URL}/rest/v1/contact_queries?select=id&limit=1`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });
  console.log('GET status:', getRes.status);
  const getBody = await getRes.json();
  console.log('GET response:', JSON.stringify(getBody, null, 2));
}

run().catch(console.error);
