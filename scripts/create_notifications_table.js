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

const SQL = `
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  priority text NOT NULL DEFAULT 'INFO', -- 'URGENT', 'ACTION REQUIRED', 'HIGH', 'INFO'
  action_url text DEFAULT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast user query
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable Supabase Realtime for notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication check skipped or handled: %', SQLERRM;
END $$;
`;

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    console.log('Creating public.notifications table & indexes...');
    await client.query(SQL);
    console.log('Successfully created public.notifications table, indexes, RLS policies, and realtime publication!');
  } catch (err) {
    console.error('Error creating notifications table:', err);
  } finally {
    await client.end();
  }
}

run();
