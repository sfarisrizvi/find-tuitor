const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.qlhcavfyllfcwifxbtbu:2Xy8IkpeFkVOE6qf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const sql = `
-- Step 1: Grant table-level privileges so the roles can even attempt operations
-- (RLS policies are checked AFTER table-level privileges pass)
GRANT INSERT ON public.contact_queries TO anon;
GRANT INSERT ON public.contact_queries TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_queries TO authenticated;

-- Step 2: Also grant sequence usage (needed for default values / uuid generation)
-- (uuid_generate_v4() is a function, not a sequence, so this is for safety)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
`;

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected...\n');

  try {
    await client.query(sql);
    console.log('✅ Table-level privileges granted successfully.\n');

    // Confirm privileges
    const privs = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_name = 'contact_queries'
        AND table_schema = 'public'
      ORDER BY grantee, privilege_type
    `);
    console.log('Current table privileges:');
    privs.rows.forEach(p => console.log(`  ${p.grantee}: ${p.privilege_type}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
