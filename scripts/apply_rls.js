require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function applyRLS() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    const sql = `
      CREATE OR REPLACE FUNCTION protect_sensitive_tutor_columns()
      RETURNS TRIGGER AS $$
      BEGIN
        -- auth.role() is available in Supabase to check the active role
        IF current_user != 'postgres' AND auth.role() != 'service_role' AND auth.role() != 'admin' THEN
          IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
            RAISE EXCEPTION 'Permission Denied: Cannot update kyc_status directly. Use API Gateway.';
          END IF;
          IF NEW.verified IS DISTINCT FROM OLD.verified THEN
            RAISE EXCEPTION 'Permission Denied: Cannot update verified directly. Use API Gateway.';
          END IF;
          IF NEW.suspended IS DISTINCT FROM OLD.suspended THEN
            RAISE EXCEPTION 'Permission Denied: Cannot update suspended directly. Use API Gateway.';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS tr_protect_sensitive_tutor_columns ON public.tutor_profiles;
      
      CREATE TRIGGER tr_protect_sensitive_tutor_columns
      BEFORE UPDATE ON public.tutor_profiles
      FOR EACH ROW
      EXECUTE FUNCTION protect_sensitive_tutor_columns();
    `;
    
    await client.query(sql);
    console.log("Successfully created trigger to protect sensitive tutor_profile columns.");
  } catch (err) {
    console.error("Error applying SQL:", err);
  } finally {
    await client.end();
  }
}

applyRLS();
