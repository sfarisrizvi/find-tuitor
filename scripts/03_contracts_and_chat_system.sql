-- ============================================================
-- MIGRATION 03: Contracts Table, Chat Schema Upgrades & Storage
-- ============================================================

BEGIN;

-- 1. Create public.contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  client_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_role      text NOT NULL CHECK (creator_role IN ('tutor', 'client')),
  child_ids         jsonb DEFAULT '[]'::jsonb,
  subjects          jsonb DEFAULT '[]'::jsonb,
  terms             text NOT NULL,
  payment_plan      text NOT NULL CHECK (payment_plan IN ('hourly', 'monthly')),
  amount            numeric(10, 2) NOT NULL CHECK (amount >= 0),
  mode              text NOT NULL CHECK (mode IN ('online', 'in-house', 'home-tuition')),
  duration_value    integer NOT NULL CHECK (duration_value > 0),
  duration_unit     text NOT NULL CHECK (duration_unit IN ('week', 'month')),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested', 'rejected', 'active', 'completed')),
  revision_feedback text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
DROP POLICY IF EXISTS "Participants and admins can view contracts" ON public.contracts;
CREATE POLICY "Participants and admins can view contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id OR 
    auth.uid() = tutor_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can insert contracts" ON public.contracts;
CREATE POLICY "Participants can insert contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = client_id OR 
    auth.uid() = tutor_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants and admins can update contracts" ON public.contracts;
CREATE POLICY "Participants and admins can update contracts"
  ON public.contracts FOR UPDATE TO authenticated
  USING (
    auth.uid() = client_id OR 
    auth.uid() = tutor_id OR 
    public.is_admin()
  )
  WITH CHECK (
    auth.uid() = client_id OR 
    auth.uid() = tutor_id OR 
    public.is_admin()
  );

-- 2. Upgrade conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 3. Upgrade messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'contract', 'offer'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS has_warning boolean DEFAULT false;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_contracts_conversation ON public.contracts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tutor ON public.contracts(tutor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_messages_contract ON public.messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(client_id, tutor_id);

-- 5. Storage Bucket setup for Chat Media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for chat-media
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
CREATE POLICY "Anyone can view chat media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-media');

COMMIT;
