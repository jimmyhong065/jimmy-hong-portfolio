-- Apply only after two independent TOTP factors have been verified in production.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'rbingwork1030@gmail.com'
    AND coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

-- Review all authenticated policies after the function changes. Every admin
-- policy must continue to call public.is_admin(); anon policies are separate.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND 'authenticated' = ANY(roles)
ORDER BY tablename, policyname;
