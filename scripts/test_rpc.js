const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlhcavfyllfcwifxbtbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGNhdmZ5bGxmY3dpZnhidGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTI2NzYsImV4cCI6MjA5ODgyODY3Nn0.a3sF8bnzX5sPDTdpwhzJSX726yZGmrOCFBhFieCH0v0'
);

const rpcParams = {
  p_city: '',
  p_subjects: null,
  p_levels: null,
  p_gender: '',
  p_verified: false,
  p_immediate_hiring: false,
  p_min_price: null,
  p_max_price: null,
  p_min_experience: null,
  p_modes: null
};

async function run() {
  const { data, error } = await supabase.rpc('search_tutors', rpcParams);
  console.log('Data:', data?.length);
  console.log('Error:', error);
}

run();
