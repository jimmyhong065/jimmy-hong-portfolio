-- Follow-up to 20261008_admin_only_rls.sql.
-- Live DB had write policies on these tables with roles other than
-- {authenticated} (e.g. TO public), so a non-admin signed-in user could still
-- INSERT into faqs. Normalise all five tables to the schema.sql shape:
--   anon:  read (and faq_submissions insert, for the public FAQ form)
--   admin: full access via is_admin()
-- Run in Supabase SQL Editor.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('faqs', 'settings', 'services', 'photo_projects', 'faq_submissions')
      AND cmd <> 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
    RAISE NOTICE 'dropped: %.% (%)', p.tablename, p.policyname, p.cmd;
  END LOOP;
END $$;

-- Public reads (same as schema.sql; recreated so they exist even if the
-- dropped ALL policies were what served reads before).
DROP POLICY IF EXISTS "anon read photo projects" ON photo_projects;
CREATE POLICY "anon read photo projects" ON photo_projects FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read settings" ON settings;
CREATE POLICY "anon read settings" ON settings FOR SELECT TO anon USING (id = 1);

DROP POLICY IF EXISTS "anon read services" ON services;
CREATE POLICY "anon read services" ON services FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read published faqs" ON faqs;
CREATE POLICY "anon read published faqs" ON faqs FOR SELECT TO anon USING (published = true);

-- Public FAQ question form.
CREATE POLICY "anon insert faq submissions" ON faq_submissions FOR INSERT TO anon WITH CHECK (true);

-- Admin full access.
DROP POLICY IF EXISTS "auth full access photo projects" ON photo_projects;
CREATE POLICY "auth full access photo projects" ON photo_projects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "auth full access settings" ON settings;
CREATE POLICY "auth full access settings" ON settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "auth full access services" ON services;
CREATE POLICY "auth full access services" ON services FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "auth full access faqs" ON faqs;
CREATE POLICY "auth full access faqs" ON faqs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "auth full access faq submissions" ON faq_submissions;
CREATE POLICY "auth full access faq submissions" ON faq_submissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Verify: every non-SELECT policy should be is_admin(), except the anon FAQ insert.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
