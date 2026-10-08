-- Restrict every "authenticated" policy in public schema to the site owner.
-- Before: any signed-up user had full CRUD (USING true). Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'rbingwork1030@gmail.com'
$$;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND roles = '{authenticated}'::name[]
  LOOP
    IF p.cmd = 'INSERT' THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (public.is_admin())',
        p.policyname, p.schemaname, p.tablename);
    ELSIF p.cmd IN ('SELECT', 'DELETE') THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (public.is_admin())',
        p.policyname, p.schemaname, p.tablename);
    ELSE
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (public.is_admin()) WITH CHECK (public.is_admin())',
        p.policyname, p.schemaname, p.tablename);
    END IF;
    RAISE NOTICE 'locked: %.% (%)', p.tablename, p.policyname, p.cmd;
  END LOOP;
END $$;

-- Verify: every row should show is_admin() in qual / with_check.
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND roles = '{authenticated}'::name[]
ORDER BY tablename;
