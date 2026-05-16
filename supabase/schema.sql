-- Posts table
CREATE TABLE posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  content      text,
  excerpt      text,
  tags         text[] DEFAULT '{}',
  published    boolean DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,
  tags          text[] DEFAULT '{}',
  cover_url     text,
  links         jsonb DEFAULT '{}',
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- RLS: Enable on both tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- posts: anon can read published only
CREATE POLICY "anon read published posts"
  ON posts FOR SELECT TO anon
  USING (published = true);

-- posts: authenticated user has full access
CREATE POLICY "auth full access posts"
  ON posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- projects: anon can read all
CREATE POLICY "anon read projects"
  ON projects FOR SELECT TO anon
  USING (true);

-- projects: authenticated user has full access
CREATE POLICY "auth full access projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
