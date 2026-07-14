-- Migration to add columns to jobs table to support advanced search & filtering
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS gender_preference TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS grade_level TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS verified_required BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS immediate_hiring BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hours_per_week INTEGER;
