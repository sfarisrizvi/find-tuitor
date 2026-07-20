const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.qlhcavfyllfcwifxbtbu:2Xy8IkpeFkVOE6qf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const sql = `
-- Remove FORCE RLS (this blocks the postgres superuser unnecessarily)
ALTER TABLE public.contact_queries NO FORCE ROW LEVEL SECURITY;

-- Check current role of anon requests
-- The sb_publishable key maps to the 'anon' role in PostgREST
-- Let's verify policies are right and try a direct anon role simulation

-- Re-confirm the insert policy exists and is correct
SELECT policyname, cmd, roles, with_check
FROM pg_policies
WHERE tablename = 'contact_queries' AND cmd = 'INSERT';
`;

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  try {
    // Remove FORCE RLS
    await client.query('ALTER TABLE public.contact_queries NO FORCE ROW LEVEL SECURITY;');
    console.log('✅ Removed FORCE ROW LEVEL SECURITY\n');

    // Now simulate what PostgREST does: SET ROLE anon, then try insert
    console.log('=== Simulating anon role insert ===\n');
    await client.query('SET LOCAL ROLE anon;');
    
    try {
      const res = await client.query(`
        INSERT INTO public.contact_queries (name, email, phone, role, message, status)
        VALUES ('Role Sim Test', 'sim@test.local', '03001234567', 'parent_student', 'Simulated anon insert', 'pending')
        RETURNING id, name
      `);
      console.log('✅ Anon role INSERT succeeded!');
      console.log('   Row:', res.rows[0]);
    } catch (e) {
      console.log('❌ Anon role INSERT failed:', e.message);
      
      // Check if it's a grant issue or RLS issue
      if (e.message.includes('permission denied')) {
        console.log('   → This is a GRANT privilege issue (not RLS)');
      } else if (e.message.includes('row-level security')) {
        console.log('   → This is an RLS policy issue');
      }
    }

    // Reset role
    await client.query('RESET ROLE;');

    // Show final policy state
    const policies = await client.query(`
      SELECT policyname, cmd, roles, with_check
      FROM pg_policies WHERE tablename = 'contact_queries' ORDER BY cmd
    `);
    console.log('\nFinal policies:');
    policies.rows.forEach(p => console.log(`  [${p.cmd}] ${p.policyname} → ${p.roles}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
