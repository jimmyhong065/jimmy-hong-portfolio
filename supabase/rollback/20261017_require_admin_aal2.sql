-- Emergency manual use only. This weakens admin authentication until the
-- forward migration is reapplied. Never run as an automatic migration.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'rbingwork1030@gmail.com'
$$;
