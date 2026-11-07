-- Optional destination link for homepage announcements (defaults to /blog in UI).
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link text;
