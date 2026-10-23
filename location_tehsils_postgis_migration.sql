-- ============================================================
-- PAKISTAN TEHSILS & SPATIAL POSTGIS GEOLOCATION MIGRATION
-- Enables Tehsil-first indexing, GPS detection, and radius searching
-- ============================================================

-- 1. Enable PostGIS Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Provinces Table
CREATE TABLE IF NOT EXISTS geo_provinces (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT
);

-- 3. Divisions Table
CREATE TABLE IF NOT EXISTS geo_divisions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  province_id INTEGER REFERENCES geo_provinces(id) ON DELETE CASCADE,
  UNIQUE(name, province_id)
);

-- 4. Districts Table
CREATE TABLE IF NOT EXISTS geo_districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  division_id INTEGER REFERENCES geo_divisions(id) ON DELETE CASCADE,
  province_id INTEGER REFERENCES geo_provinces(id) ON DELETE CASCADE,
  UNIQUE(name, province_id)
);

-- 5. Tehsils Master Table (704 Official Tehsils)
CREATE TABLE IF NOT EXISTS geo_tehsils (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  division_name TEXT,
  province_name TEXT NOT NULL,
  district_id INTEGER REFERENCES geo_districts(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, district_name)
);

-- Spatial GIST index for sub-millisecond distance matching
CREATE INDEX IF NOT EXISTS idx_geo_tehsils_geom ON geo_tehsils USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_tehsils_name_trgm ON geo_tehsils(name);
CREATE INDEX IF NOT EXISTS idx_geo_tehsils_district ON geo_tehsils(district_name);

-- 6. Add Location & PostGIS Columns to Existing Profiles & Jobs Tables
-- jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tehsil TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_jobs_geom ON jobs USING GIST (geom);

-- tutor_profiles table
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS tehsil TEXT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_geom ON tutor_profiles USING GIST (geom);

-- client_profiles table
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS tehsil TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_client_profiles_geom ON client_profiles USING GIST (geom);

-- 7. Trigger to automatically keep `geom` in sync whenever `lat` and `lng` are updated
CREATE OR REPLACE FUNCTION sync_location_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_sync_geom ON jobs;
CREATE TRIGGER trg_jobs_sync_geom
BEFORE INSERT OR UPDATE OF lat, lng ON jobs
FOR EACH ROW EXECUTE FUNCTION sync_location_geom();

DROP TRIGGER IF EXISTS trg_tutor_profiles_sync_geom ON tutor_profiles;
CREATE TRIGGER trg_tutor_profiles_sync_geom
BEFORE INSERT OR UPDATE OF lat, lng ON tutor_profiles
FOR EACH ROW EXECUTE FUNCTION sync_location_geom();

DROP TRIGGER IF EXISTS trg_geo_tehsils_sync_geom ON geo_tehsils;
CREATE TRIGGER trg_geo_tehsils_sync_geom
BEFORE INSERT OR UPDATE OF lat, lng ON geo_tehsils
FOR EACH ROW EXECUTE FUNCTION sync_location_geom();

-- 8. Spatial RPC Function: Find Nearest Tehsils within Radius
CREATE OR REPLACE FUNCTION get_nearby_tehsils(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 25.0,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  tehsil_id INTEGER,
  tehsil_name TEXT,
  district_name TEXT,
  province_name TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.name,
    gt.district_name,
    gt.province_name,
    ROUND((ST_Distance(gt.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0)::numeric, 1)::double precision AS distance_km
  FROM geo_tehsils gt
  WHERE ST_DWithin(gt.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000.0)
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Spatial RPC Function: Find Jobs within Radius (for Tutors)
CREATE OR REPLACE FUNCTION search_jobs_by_radius(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 20.0
)
RETURNS TABLE (
  job_id TEXT,
  title TEXT,
  subject TEXT,
  grade_level TEXT,
  mode TEXT,
  tehsil TEXT,
  area TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id::text,
    j.title,
    j.subject,
    j.grade_level,
    j.mode,
    COALESCE(j.tehsil, j.city) as tehsil,
    j.area,
    ROUND((ST_Distance(j.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0)::numeric, 1)::double precision AS distance_km
  FROM jobs j
  WHERE j.geom IS NOT NULL
    AND ST_DWithin(j.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000.0)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
