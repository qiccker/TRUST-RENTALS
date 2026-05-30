-- 1️⃣ Add enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
  END IF;
END$$;

-- 2️⃣ Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'customer';

-- 3️⃣ Insert bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-documents',
  'customer-documents',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 8️⃣ RLS policies for profiles (select & update)
-- Helper function to break infinite recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  );

-- 9️⃣ Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 🔟 Add double booking protection constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_double_booking;

ALTER TABLE public.bookings
  ADD CONSTRAINT no_double_booking EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  ) WHERE (status IN ('pending_payment', 'confirmed'));

