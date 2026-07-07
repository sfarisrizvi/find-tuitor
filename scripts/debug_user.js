const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlhcavfyllfcwifxbtbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGNhdmZ5bGxmY3dpZnhidGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjY3NiwiZXhwIjoyMDk4ODI4Njc2fQ.VVWW5Hka16m1ds-qLTXKEPJ-umS8Wv284a24uJHK4i0'
);

async function run() {
  const { data: tutors, error: tErr } = await supabase.from('tutor_profiles').select('id, full_name, email').limit(5);
  console.log('Tutor profiles:', tutors, tErr);

  const { data: clients, error: cErr } = await supabase.from('client_profiles').select('id, full_name, email').limit(5);
  console.log('Client profiles:', clients, cErr);
}

run();
