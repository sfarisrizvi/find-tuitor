-- ============================================================
-- MIGRATION 07: Credit Event Triggers, Bonus RPCs & Escrow Locks
-- ============================================================

BEGIN;

-- 1. Update handle_new_user() trigger to automatically grant 1,500 credits to clients
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_wallet_id uuid;
BEGIN
  -- Force role to either client or tutor based on metadata
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    v_role := 'client';
    INSERT INTO public.client_profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
    ON CONFLICT (id) DO NOTHING;

    -- Initialize Client Wallet with 1,500 free signup bonus credits
    INSERT INTO public.wallets (user_id, user_role, balance, total_deposited)
    VALUES (NEW.id, 'client', 1500.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_wallet_id;

    IF v_wallet_id IS NOT NULL THEN
      INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_after, reference_id, description
      )
      VALUES (
        v_wallet_id, NEW.id, 'signup_bonus', 1500.00, 1500.00, NEW.id::text,
        'Welcome bonus: 1,500 free credits for signing up!'
      );
    END IF;

  ELSE
    v_role := 'tutor';
    INSERT INTO public.tutor_profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
    ON CONFLICT (id) DO NOTHING;

    -- Initialize Tutor Wallet with 0.00 balance
    INSERT INTO public.wallets (user_id, user_role, balance, total_deposited)
    VALUES (NEW.id, 'tutor', 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Insert securely into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Function: Claim Tutor 5-Day Onboarding Bonus (+1,000 Credits)
CREATE OR REPLACE FUNCTION public.claim_tutor_onboarding_bonus(p_tutor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tutor public.tutor_profiles;
  v_wallet public.wallets;
  v_already_claimed boolean;
  v_days_diff numeric;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_tutor FROM public.tutor_profiles WHERE id = p_tutor_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tutor not found.');
  END IF;

  IF NOT coalesce(v_tutor.onboarding_complete, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding is not complete.');
  END IF;

  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM public.wallet_transactions 
    WHERE user_id = p_tutor_id AND type = 'onboarding_bonus'
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding bonus already claimed.');
  END IF;

  -- Check 5-day window from created_at
  v_days_diff := extract(epoch from (now() - v_tutor.created_at)) / 86400;
  IF v_days_diff > 5.0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding was completed after the 5-day incentive window.');
  END IF;

  -- Get or create wallet
  v_wallet := public.get_or_create_wallet(p_tutor_id, 'tutor');
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  v_new_balance := v_wallet.balance + 1000.00;

  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description
  )
  VALUES (
    v_wallet.id, p_tutor_id, 'onboarding_bonus', 1000.00, v_new_balance, p_tutor_id::text,
    'Fast-track incentive: 1,000 free credits for completing onboarding within 5 days!'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'bonus', 1000);
END;
$$;


-- 3. Function: Award Tutor Verification Bonus (+500 Credits)
CREATE OR REPLACE FUNCTION public.award_tutor_verification_bonus(p_tutor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tutor public.tutor_profiles;
  v_wallet public.wallets;
  v_already_claimed boolean;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_tutor FROM public.tutor_profiles WHERE id = p_tutor_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tutor not found.');
  END IF;

  IF v_tutor.kyc_status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tutor KYC is not approved.');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.wallet_transactions 
    WHERE user_id = p_tutor_id AND type = 'kyc_verified_bonus'
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification bonus already awarded.');
  END IF;

  v_wallet := public.get_or_create_wallet(p_tutor_id, 'tutor');
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  v_new_balance := v_wallet.balance + 500.00;

  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description
  )
  VALUES (
    v_wallet.id, p_tutor_id, 'kyc_verified_bonus', 500.00, v_new_balance, p_tutor_id::text,
    'Verification reward: 500 free credits for getting your profile verified by admin!'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'bonus', 500);
END;
$$;


-- 4. Function: Unlock Tutor Contact Details (500 Credits for Client)
CREATE OR REPLACE FUNCTION public.unlock_tutor_contacts(p_client_id uuid, p_tutor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_unlocked boolean;
  v_wallet public.wallets;
  v_new_balance numeric;
  v_tutor public.tutor_profiles;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM public.unlocked_contacts
    WHERE client_id = p_client_id AND tutor_id = p_tutor_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    SELECT * INTO v_tutor FROM public.tutor_profiles WHERE id = p_tutor_id;
    RETURN jsonb_build_object(
      'success', true,
      'already_unlocked', true,
      'phone', v_tutor.phone,
      'email', v_tutor.email
    );
  END IF;

  -- Lock wallet
  v_wallet := public.get_or_create_wallet(p_client_id, 'client');
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  IF v_wallet.balance < 500.00 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits. You need 500 credits to unlock tutor contact details.',
      'balance', v_wallet.balance,
      'required', 500
    );
  END IF;

  v_new_balance := v_wallet.balance - 500.00;

  UPDATE public.wallets
  SET balance = v_new_balance,
      total_spent = total_spent + 500.00,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.unlocked_contacts (client_id, tutor_id, cost_credits)
  VALUES (p_client_id, p_tutor_id, 500)
  ON CONFLICT (client_id, tutor_id) DO NOTHING;

  SELECT * INTO v_tutor FROM public.tutor_profiles WHERE id = p_tutor_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description, metadata
  )
  VALUES (
    v_wallet.id, p_client_id, 'contact_unlock', -500.00, v_new_balance, p_tutor_id::text,
    format('Unlocked direct contact details (phone & email) for tutor %s.', coalesce(v_tutor.full_name, 'Tutor')),
    jsonb_build_object('tutor_id', p_tutor_id, 'tutor_name', v_tutor.full_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'phone', v_tutor.phone,
    'email', v_tutor.email
  );
END;
$$;


-- 5. Function: Lock Contract Escrow (Client pays 100% of Contract PKR into Escrow)
CREATE OR REPLACE FUNCTION public.lock_contract_escrow(p_client_id uuid, p_contract_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets;
  v_new_balance numeric;
  v_new_escrow numeric;
BEGIN
  v_wallet := public.get_or_create_wallet(p_client_id, 'client');
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient credits. You need %s credits to fund this contract in escrow. Your balance is %s credits.', p_amount, v_wallet.balance),
      'balance', v_wallet.balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_wallet.balance - p_amount;
  v_new_escrow := v_wallet.escrow_balance + p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance,
      escrow_balance = v_new_escrow,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description
  )
  VALUES (
    v_wallet.id, p_client_id, 'contract_escrow_lock', -p_amount, v_new_balance, p_contract_id::text,
    format('Locked %s credits into Platform Escrow for Tuition Contract offer.', p_amount)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'new_escrow', v_new_escrow);
END;
$$;


-- 6. Function: Deduct Tutor 10% Platform Fee on Contract Acceptance
CREATE OR REPLACE FUNCTION public.tutor_accept_contract_fee(p_tutor_id uuid, p_contract_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee numeric;
  v_wallet public.wallets;
  v_new_balance numeric;
BEGIN
  v_fee := round(p_amount * 0.10); -- 10% Platform Success Fee

  v_wallet := public.get_or_create_wallet(p_tutor_id, 'tutor');
  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wallet.id FOR UPDATE;

  IF v_wallet.balance < v_fee THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient credits to accept contract. You need %s credits (10%% fee), but your balance is %s credits. Please buy credits via bank transfer.', v_fee, v_wallet.balance),
      'balance', v_wallet.balance,
      'required', v_fee
    );
  END IF;

  v_new_balance := v_wallet.balance - v_fee;

  UPDATE public.wallets
  SET balance = v_new_balance,
      total_spent = total_spent + v_fee,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, reference_id, description
  )
  VALUES (
    v_wallet.id, p_tutor_id, 'contract_tutor_fee', -v_fee, v_new_balance, p_contract_id::text,
    format('Platform 10%% fee deducted for accepting PKR %s monthly tuition contract (30-day validity).', p_amount)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'fee_deducted', v_fee);
END;
$$;

-- Backfill 1,500 credits for existing client accounts who never received it
DO $$
DECLARE
  r RECORD;
  v_wid uuid;
BEGIN
  FOR r IN 
    SELECT cp.id 
    FROM public.client_profiles cp
    WHERE NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions wt 
      WHERE wt.user_id = cp.id AND wt.type = 'signup_bonus'
    )
  LOOP
    SELECT id INTO v_wid FROM public.wallets WHERE user_id = r.id;
    IF v_wid IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + 1500.00 WHERE id = v_wid;
      INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference_id, description)
      VALUES (v_wid, r.id, 'signup_bonus', 1500.00, (SELECT balance FROM public.wallets WHERE id = v_wid), r.id::text, 'Welcome bonus: 1,500 free credits for signing up!');
    END IF;
  END LOOP;
END $$;

COMMIT;
