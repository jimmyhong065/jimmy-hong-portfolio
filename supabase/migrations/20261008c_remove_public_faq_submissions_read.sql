-- Live production audit on 2026-10-25 found this legacy SELECT policy:
--   TO public USING (auth.role() = 'authenticated')
-- Any signed-in user can read FAQ submissions through it, even though the
-- separate admin ALL policy calls public.is_admin(). Remove this policy before
-- the MFA rollout. The public FAQ form only needs the anon INSERT policy.

DROP POLICY IF EXISTS "auth read submissions" ON public.faq_submissions;

-- Expected afterward: anon INSERT and authenticated ALL via is_admin();
-- no SELECT policy on faq_submissions. Review the returned rows before rollout.
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'faq_submissions'
ORDER BY policyname;
