-- ============================================================
-- MIGRATION 09: Verified Contract Reviews & Reputation System
-- Anti-Fraud Closed Loop Reviews, Dimension Scores & Triggers
-- ============================================================

-- 1. Create contract_reviews table
CREATE TABLE IF NOT EXISTS public.contract_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_role       TEXT NOT NULL CHECK (reviewer_role IN ('client', 'tutor')),
  
  -- Rating Dimensions (1.0 - 5.0)
  overall_rating      NUMERIC(2,1) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
  subject_mastery     INTEGER CHECK (subject_mastery BETWEEN 1 AND 5),
  punctuality         INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  communication       INTEGER CHECK (communication BETWEEN 1 AND 5),
  
  -- Qualitative Feedback
  recommend_score     BOOLEAN NOT NULL DEFAULT true,
  feedback_text       TEXT NOT NULL CHECK (length(trim(feedback_text)) >= 10),
  private_feedback    TEXT,
  
  -- Public Response (e.g. Tutor replying to a Parent's review)
  response_text       TEXT,
  responded_at        TIMESTAMPTZ,
  
  -- Verification & Moderation Flags
  is_verified_hire    BOOLEAN NOT NULL DEFAULT true,
  is_flagged          BOOLEAN NOT NULL DEFAULT false,
  flag_reason         TEXT,
  status              TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending_blind', 'published', 'hidden')),
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_contract_reviewer UNIQUE(contract_id, reviewer_id),
  CONSTRAINT no_self_review CHECK (reviewer_id <> reviewee_id)
);

-- 2. Indexes for high performance lookup
CREATE INDEX IF NOT EXISTS idx_contract_reviews_reviewee ON public.contract_reviews(reviewee_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_contract ON public.contract_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_created ON public.contract_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_reviewer ON public.contract_reviews(reviewer_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.contract_reviews ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (including anon) can view published reviews
DROP POLICY IF EXISTS "Public can view published reviews" ON public.contract_reviews;
CREATE POLICY "Public can view published reviews"
  ON public.contract_reviews FOR SELECT
  USING (status = 'published');

-- Policy 2: Reviewers and reviewees can view their own reviews regardless of status
DROP POLICY IF EXISTS "Participants can view own reviews" ON public.contract_reviews;
CREATE POLICY "Participants can view own reviews"
  ON public.contract_reviews FOR SELECT
  TO authenticated
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Policy 3: Authenticated participants of a contract can insert reviews
DROP POLICY IF EXISTS "Contract participants can insert review" ON public.contract_reviews;
CREATE POLICY "Contract participants can insert review"
  ON public.contract_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.tutor_id = auth.uid())
        AND c.status IN ('approved', 'active', 'completed')
    )
  );

-- Policy 4: Reviewees can add a public response
DROP POLICY IF EXISTS "Reviewee can post response" ON public.contract_reviews;
CREATE POLICY "Reviewee can post response"
  ON public.contract_reviews FOR UPDATE
  TO authenticated
  USING (reviewee_id = auth.uid())
  WITH CHECK (reviewee_id = auth.uid());

-- 4. Automatic Rating & JSS Recalculation Trigger Function
CREATE OR REPLACE FUNCTION public.update_tutor_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tutor_id UUID;
  v_avg NUMERIC(3,2);
  v_count INTEGER;
  v_positive_count INTEGER;
  v_jss INTEGER;
BEGIN
  -- Determine tutor id
  IF TG_OP = 'DELETE' THEN
    IF OLD.reviewer_role = 'client' THEN
      v_tutor_id := OLD.reviewee_id;
    ELSE
      RETURN OLD;
    END IF;
  ELSE
    IF NEW.reviewer_role = 'client' THEN
      v_tutor_id := NEW.reviewee_id;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Calculate stats for published reviews of this tutor
  SELECT 
    ROUND(AVG(overall_rating)::numeric, 1),
    COUNT(*),
    COUNT(*) FILTER (WHERE overall_rating >= 4.0 OR recommend_score = true)
  INTO v_avg, v_count, v_positive_count
  FROM public.contract_reviews
  WHERE reviewee_id = v_tutor_id 
    AND status = 'published' 
    AND reviewer_role = 'client';

  IF v_count > 0 THEN
    v_jss := LEAST(100, GREATEST(0, ROUND((v_positive_count::numeric / v_count::numeric) * 100)));
  ELSE
    v_avg := 5.0;
    v_count := 0;
    v_jss := 100;
  END IF;

  UPDATE public.tutor_profiles
  SET 
    rating = COALESCE(v_avg, 5.0),
    reviews_count = COALESCE(v_count, 0),
    jss_score = COALESCE(v_jss, 100),
    updated_at = now()
  WHERE id = v_tutor_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_tutor_reviews ON public.contract_reviews;
CREATE TRIGGER trg_update_tutor_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.contract_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_tutor_review_stats();

-- 5. Helper RPC to complete contract and release final status
CREATE OR REPLACE FUNCTION public.complete_contract_and_unlock_review(
  p_contract_id UUID,
  p_user_id UUID,
  p_completion_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Fetch contract
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
  END IF;

  -- Ensure caller is a participant
  IF v_contract.client_id <> p_user_id AND v_contract.tutor_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not a party to this contract');
  END IF;

  -- Update contract to completed
  UPDATE public.contracts
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = p_contract_id;

  -- Update associated escrow contract status if held
  UPDATE public.escrow_contracts
  SET 
    status = 'released',
    updated_at = now()
  WHERE contract_id = p_contract_id AND status = 'held';

  RETURN jsonb_build_object(
    'success', true, 
    'contract_id', p_contract_id,
    'status', 'completed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_contract_and_unlock_review(UUID, UUID, TEXT) TO authenticated, service_role;
