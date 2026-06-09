-- Supabase schema for Jimmy Hong Portfolio.
-- Intended for fresh environment bootstrap and as source-of-truth documentation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  content      text,
  excerpt      text,
  tags         text[] DEFAULT '{}',
  published    boolean DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS posts_set_updated_at ON posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- QA portfolio projects
CREATE TABLE IF NOT EXISTS projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,
  tags          text[] DEFAULT '{}',
  cover_url     text,
  images        jsonb DEFAULT '[]'::jsonb,
  links         jsonb DEFAULT '{}'::jsonb,
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS projects_set_updated_at ON projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Photography portfolio projects
CREATE TABLE IF NOT EXISTS photo_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,
  cover_url     text,
  images        jsonb DEFAULT '[]'::jsonb,
  tags          text[] DEFAULT '{}',
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS photo_projects_set_updated_at ON photo_projects;
CREATE TRIGGER photo_projects_set_updated_at
  BEFORE UPDATE ON photo_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Singleton site settings row. The app reads id = 1.
CREATE TABLE IF NOT EXISTS settings (
  id                    int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  email                 text DEFAULT '',
  github_url            text DEFAULT '',
  linkedin_url          text DEFAULT '',
  avatar_url            text DEFAULT '',
  photo_avatar_url      text DEFAULT '',
  seo_keywords          text DEFAULT '',
  seo_description       text DEFAULT '',
  seo_photo_keywords    text DEFAULT '',
  seo_photo_description text DEFAULT '',
  accent_color          text DEFAULT '#111827',
  font_family           text DEFAULT 'Noto Sans TC',
  heading_font          text DEFAULT 'Noto Sans TC',
  bg_color              text DEFAULT '#ffffff',
  hidden_pages          text[] DEFAULT '{}',
  hidden_sections       text[] DEFAULT '{}',
  nav_tabs              jsonb,
  brand_name            text DEFAULT 'QA Lab',
  cta_text              text DEFAULT '聯絡我',
  card_style            text DEFAULT 'shadowed',
  hero_name             text DEFAULT 'Jimmy Hong',
  hero_subtitle         text DEFAULT 'QA Engineer / 品質架構師',
  hero_tagline          text DEFAULT '打造讓團隊信任的 QA 系統',
  hero_description      text DEFAULT '專注測試流程設計與品質架構。',
  hero_skills           text[] DEFAULT ARRAY['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'],
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS settings_set_updated_at ON settings;
CREATE TRIGGER settings_set_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Service offerings shown on public pages.
CREATE TABLE IF NOT EXISTS services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL DEFAULT 'qa',
  title         text NOT NULL,
  description   text,
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS services_set_updated_at ON services;
CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Homepage announcements.
CREATE TABLE IF NOT EXISTS announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  content    text,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS announcements_set_updated_at ON announcements;
CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Public FAQ entries.
CREATE TABLE IF NOT EXISTS faqs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question      text NOT NULL,
  answer        text NOT NULL,
  category      text DEFAULT '一般問題',
  display_order int DEFAULT 0,
  published     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS faqs_set_updated_at ON faqs;
CREATE TRIGGER faqs_set_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Public FAQ/contact form submissions.
CREATE TABLE IF NOT EXISTS faq_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  category   text NOT NULL,
  message    text NOT NULL,
  line_id    text,
  status     text DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS faq_submissions_set_updated_at ON faq_submissions;
CREATE TRIGGER faq_submissions_set_updated_at
  BEFORE UPDATE ON faq_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Email subscribers. Public functions use the service role key for writes.
CREATE TABLE IF NOT EXISTS email_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  token      uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  confirmed  boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS email_subscribers_set_updated_at ON email_subscribers;
CREATE TRIGGER email_subscribers_set_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Browser push subscriptions. Public functions use the service role key for writes.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text UNIQUE NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notification history shown in the notifications page.
CREATE TABLE IF NOT EXISTS notifications (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title   text NOT NULL,
  body    text,
  url     text,
  sent_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING gin (tags);
CREATE INDEX IF NOT EXISTS projects_display_order_idx ON projects (display_order);
CREATE INDEX IF NOT EXISTS projects_tags_idx ON projects USING gin (tags);
CREATE INDEX IF NOT EXISTS photo_projects_display_order_idx ON photo_projects (display_order);
CREATE INDEX IF NOT EXISTS photo_projects_tags_idx ON photo_projects USING gin (tags);
CREATE INDEX IF NOT EXISTS services_type_order_idx ON services (type, display_order);
CREATE INDEX IF NOT EXISTS announcements_active_created_idx ON announcements (active, created_at DESC);
CREATE INDEX IF NOT EXISTS faqs_published_order_idx ON faqs (published, category, display_order);
CREATE INDEX IF NOT EXISTS faq_submissions_status_created_idx ON faq_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_sent_at_idx ON notifications (sent_at DESC);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read published posts" ON posts;
CREATE POLICY "anon read published posts"
  ON posts FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS "auth full access posts" ON posts;
CREATE POLICY "auth full access posts"
  ON posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read projects" ON projects;
CREATE POLICY "anon read projects"
  ON projects FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "auth full access projects" ON projects;
CREATE POLICY "auth full access projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read photo projects" ON photo_projects;
CREATE POLICY "anon read photo projects"
  ON photo_projects FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "auth full access photo projects" ON photo_projects;
CREATE POLICY "auth full access photo projects"
  ON photo_projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read settings" ON settings;
CREATE POLICY "anon read settings"
  ON settings FOR SELECT TO anon
  USING (id = 1);

DROP POLICY IF EXISTS "auth full access settings" ON settings;
CREATE POLICY "auth full access settings"
  ON settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read services" ON services;
CREATE POLICY "anon read services"
  ON services FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "auth full access services" ON services;
CREATE POLICY "auth full access services"
  ON services FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read active announcements" ON announcements;
CREATE POLICY "anon read active announcements"
  ON announcements FOR SELECT TO anon
  USING (active = true);

DROP POLICY IF EXISTS "auth full access announcements" ON announcements;
CREATE POLICY "auth full access announcements"
  ON announcements FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read published faqs" ON faqs;
CREATE POLICY "anon read published faqs"
  ON faqs FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS "auth full access faqs" ON faqs;
CREATE POLICY "auth full access faqs"
  ON faqs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert faq submissions" ON faq_submissions;
CREATE POLICY "anon insert faq submissions"
  ON faq_submissions FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth full access faq submissions" ON faq_submissions;
CREATE POLICY "auth full access faq submissions"
  ON faq_submissions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- No direct client policies for email_subscribers.
-- Admin subscriber APIs verify ADMIN_EMAIL and query with the service role key.
DROP POLICY IF EXISTS "auth read email subscribers" ON email_subscribers;

-- No anon policy for push_subscriptions. Service-role functions manage subscriptions.

DROP POLICY IF EXISTS "anon read notifications" ON notifications;
CREATE POLICY "anon read notifications"
  ON notifications FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "auth full access notifications" ON notifications;
CREATE POLICY "auth full access notifications"
  ON notifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
