-- ============================================================
-- MIGRATION 06: Credit & Escrow System, Wallets & Payment Slips
-- ============================================================

BEGIN;

-- 1. User Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role       text NOT NULL CHECK (user_role IN ('client', 'tutor')),
  balance         numeric(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  escrow_balance  numeric(12, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_balance >= 0),
  total_deposited numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_spent     numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- 2. Credit Requests (Manual bank deposit receipts from parents & tutors)
CREATE TABLE IF NOT EXISTS public.credit_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role         text NOT NULL CHECK (user_role IN ('client', 'tutor')),
  amount_pkr        numeric(12, 2) NOT NULL CHECK (amount_pkr > 0),
  credits_requested integer NOT NULL CHECK (credits_requested > 0),
  bank_name         text NOT NULL,
  transaction_ref   text,
  screenshot_url    text NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  admin_notes       text,
  reviewed_by       uuid REFERENCES auth.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

-- 3. Wallet Transactions Ledger (Double-Entry audit log)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN (
                  'signup_bonus',
                  'onboarding_bonus',
                  'kyc_verified_bonus',
                  'bank_deposit',
                  'chat_initiation',
                  'contact_unlock',
                  'contract_escrow_lock',
                  'contract_tutor_fee',
                  'contract_escrow_release',
                  'contract_refund',
                  'admin_adjustment'
                )),
  amount        numeric(12, 2) NOT NULL,
  balance_after numeric(12, 2) NOT NULL,
  reference_id  text,
  description   text NOT NULL,
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- 4. Unlocked Contacts (Persistent registry of client unlocks)
CREATE TABLE IF NOT EXISTS public.unlocked_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_credits  integer NOT NULL DEFAULT 500,
  unlocked_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(client_id, tutor_id)
);

-- 5. Escrow Contracts (Tracks contract funding, active 30-day cycles & fees)
CREATE TABLE IF NOT EXISTS public.escrow_contracts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id        uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES auth.users(id),
  tutor_id           uuid NOT NULL REFERENCES auth.users(id),
  cycle_number       integer NOT NULL DEFAULT 1,
  cycle_amount_pkr   numeric(12, 2) NOT NULL,
  tutor_fee_credits  integer NOT NULL,
  status             text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
  cycle_start_date   timestamptz DEFAULT now() NOT NULL,
  cycle_end_date     timestamptz NOT NULL,
  next_renewal_date  timestamptz NOT NULL,
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_status ON public.credit_requests(status);
CREATE INDEX IF NOT EXISTS idx_credit_requests_user ON public.credit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_contacts_pair ON public.unlocked_contacts(client_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contracts_contract ON public.escrow_contracts(contract_id);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_contracts ENABLE ROW LEVEL SECURITY;

-- Wallets RLS
DROP POLICY IF EXISTS "Users can view own wallet or admin" ON public.wallets;
CREATE POLICY "Users can view own wallet or admin"
  ON public.wallets FOR SELECT TO authenticated
  USING ( auth.uid() = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users can insert own wallet or admin" ON public.wallets;
CREATE POLICY "Users can insert own wallet or admin"
  ON public.wallets FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Admins can update wallets" ON public.wallets;
CREATE POLICY "Admins can update wallets"
  ON public.wallets FOR UPDATE TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- Credit Requests RLS
DROP POLICY IF EXISTS "Users can view own requests or admin" ON public.credit_requests;
CREATE POLICY "Users can view own requests or admin"
  ON public.credit_requests FOR SELECT TO authenticated
  USING ( auth.uid() = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users can create credit requests" ON public.credit_requests;
CREATE POLICY "Users can create credit requests"
  ON public.credit_requests FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Admins can update credit requests" ON public.credit_requests;
CREATE POLICY "Admins can update credit requests"
  ON public.credit_requests FOR UPDATE TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- Wallet Transactions RLS
DROP POLICY IF EXISTS "Users can view own transactions or admin" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions or admin"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING ( auth.uid() = user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Admins can insert transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can insert transactions"
  ON public.wallet_transactions FOR INSERT TO authenticated
  WITH CHECK ( public.is_admin() );

-- Unlocked Contacts RLS
DROP POLICY IF EXISTS "Participants and admin view unlocked contacts" ON public.unlocked_contacts;
CREATE POLICY "Participants and admin view unlocked contacts"
  ON public.unlocked_contacts FOR SELECT TO authenticated
  USING ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );

DROP POLICY IF EXISTS "Clients can insert unlocked contacts" ON public.unlocked_contacts;
CREATE POLICY "Clients can insert unlocked contacts"
  ON public.unlocked_contacts FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = client_id OR public.is_admin() );

-- Escrow Contracts RLS
DROP POLICY IF EXISTS "Participants and admin view escrow contracts" ON public.escrow_contracts;
CREATE POLICY "Participants and admin view escrow contracts"
  ON public.escrow_contracts FOR SELECT TO authenticated
  USING ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );

DROP POLICY IF EXISTS "Participants and admin insert escrow contracts" ON public.escrow_contracts;
CREATE POLICY "Participants and admin insert escrow contracts"
  ON public.escrow_contracts FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );

DROP POLICY IF EXISTS "Participants and admin update escrow contracts" ON public.escrow_contracts;
CREATE POLICY "Participants and admin update escrow contracts"
  ON public.escrow_contracts FOR UPDATE TO authenticated
  USING ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() )
  WITH CHECK ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );

-- ============================================================
-- HELPER FUNCTIONS & RPCs
-- ============================================================

-- Function: Ensure wallet exists for user
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid, p_role text)
RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, user_role, balance)
    VALUES (p_user_id, p_role, 0.00)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_wallet;
    
    IF v_wallet IS NULL THEN
      SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
    END IF;
  END IF;
  RETURN v_wallet;
END;
$$;

-- Function: Atomic Deduct Credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text,
  p_reference_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found.');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits.', 'balance', v_wallet.balance, 'required', p_amount);
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance,
      total_spent = total_spent + p_amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description, metadata
  )
  VALUES (
    v_wallet.id, p_user_id, p_type, -p_amount, v_new_balance, p_reference_id, p_description, p_metadata
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Function: Atomic Admin Allocate Credits
CREATE OR REPLACE FUNCTION public.admin_approve_credit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_credits_to_add integer,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.credit_requests;
  v_wallet public.wallets;
  v_new_balance numeric;
BEGIN
  -- Verify admin
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only admins can approve credits.');
  END IF;

  SELECT * INTO v_req FROM public.credit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit request not found.');
  END IF;

  IF v_req.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit request is already approved.');
  END IF;

  -- Get or create user wallet
  v_wallet := public.get_or_create_wallet(v_req.user_id, v_req.user_role);

  -- Lock wallet
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  v_new_balance := v_wallet.balance + p_credits_to_add;

  -- Update wallet
  UPDATE public.wallets
  SET balance = v_new_balance,
      total_deposited = total_deposited + p_credits_to_add,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- Record ledger transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description, metadata
  )
  VALUES (
    v_wallet.id,
    v_req.user_id,
    'bank_deposit',
    p_credits_to_add,
    v_new_balance,
    v_req.id::text,
    format('Manual bank deposit approved (%s PKR). Allocated by Admin.', v_req.amount_pkr),
    jsonb_build_object(
      'admin_id', p_admin_id,
      'bank_name', v_req.bank_name,
      'transaction_ref', v_req.transaction_ref,
      'screenshot_url', v_req.screenshot_url,
      'notes', p_admin_notes
    )
  );

  -- Update credit request
  UPDATE public.credit_requests
  SET status = 'approved',
      credits_requested = p_credits_to_add,
      admin_notes = coalesce(p_admin_notes, admin_notes),
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = v_req.id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req.id,
    'user_id', v_req.user_id,
    'new_balance', v_new_balance,
    'credits_added', p_credits_to_add
  );
END;
$$;

-- Function: Admin Reject Credit Request
CREATE OR REPLACE FUNCTION public.admin_reject_credit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_admin_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.credit_requests;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only admins can reject credits.');
  END IF;

  SELECT * INTO v_req FROM public.credit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit request not found.');
  END IF;

  UPDATE public.credit_requests
  SET status = 'rejected',
      admin_notes = p_admin_notes,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = v_req.id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req.id);
END;
$$;

-- Initialize wallets for existing users
INSERT INTO public.wallets (user_id, user_role, balance)
SELECT id, 'tutor', 0.00 FROM public.tutor_profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.wallets (user_id, user_role, balance)
SELECT id, 'client', 0.00 FROM public.client_profiles
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
