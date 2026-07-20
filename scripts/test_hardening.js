const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const DATABASE_URL = env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

async function verify() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('\n🔍 Verifying Backend Hardening and Database Schema Changes...\n');
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Verify user_roles table exists and contains entries
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
      );
    `);
    const tableExists = tableCheck.rows[0].exists;
    console.log(tableExists ? '✅ Table public.user_roles exists.' : '❌ Table public.user_roles NOT found.');

    if (tableExists) {
      const countCheck = await client.query(`SELECT COUNT(*) FROM public.user_roles;`);
      console.log(`✅ Table public.user_roles contains ${countCheck.rows[0].count} registered user roles.`);
    }

    // 2. Verify handle_new_user trigger function includes is_admin protection/role validation
    const funcCheck = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
    `);
    const funcSrc = funcCheck.rows[0]?.prosrc || '';
    if (funcSrc.includes('user_roles') && funcSrc.includes('v_role')) {
      console.log('✅ Trigger function public.handle_new_user() is secured and writes roles to public.user_roles.');
    } else {
      console.log('❌ Trigger function public.handle_new_user() is NOT secured!');
    }

    // 3. Verify indexes exist
    const indexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'children' AND indexname = 'idx_children_client_id';
    `);
    const indexExists = indexCheck.rows.length > 0;
    console.log(indexExists ? '✅ Index idx_children_client_id exists on children.' : '❌ Index idx_children_client_id NOT found.');

    // 4. Verify search_tutors RPC works with pagination limit/offset
    const rpcCheck = await client.query(`
      SELECT * FROM public.search_tutors(p_limit => 2, p_offset => 0);
    `);
    console.log(`✅ search_tutors RPC executed successfully. Returned ${rpcCheck.rows.length} tutors for limit 2.`);

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    await client.end();
  }
}

verify();
