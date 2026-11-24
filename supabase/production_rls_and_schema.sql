-- AHİD Production Security & RLS Migration Script
-- Run this in Supabase SQL Editor if you migrate to strict service-role server access.
-- Note: After enabling strict RLS, ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local / deployment environment.

-- 1. Enable Row Level Security on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS member_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cms_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 2. Public read-only policies for public catalog/editorial content
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read articles" ON articles;
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read public news" ON news_announcements;
CREATE POLICY "Public read public news" ON news_announcements FOR SELECT USING (COALESCE(is_member_only, false) = false);

DROP POLICY IF EXISTS "Public read documents" ON documents;
CREATE POLICY "Public read documents" ON documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read board members" ON board_members;
CREATE POLICY "Public read board members" ON board_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read live media" ON media_assets;
CREATE POLICY "Public read live media" ON media_assets FOR SELECT USING (COALESCE(is_live, true) = true);

-- Note: Sensitive tables (users, membership_applications, contact_messages, member_dues,
-- event_registrations, newsletter_subscribers, cms_variables) have no anon read policy;
-- they are accessed exclusively through server-side API routes using SUPABASE_SERVICE_ROLE_KEY.

-- 3. Recommended indexes for frequent filters and joins
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_member_no ON users (member_no);
CREATE INDEX IF NOT EXISTS idx_applications_status_created ON membership_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_email ON membership_applications (email);
CREATE INDEX IF NOT EXISTS idx_event_regs_event_email ON event_registrations (event_id, email);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_announcements (slug);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_documents_code ON documents (document_code);
CREATE INDEX IF NOT EXISTS idx_dues_user_period ON member_dues (user_id, period);
CREATE INDEX IF NOT EXISTS idx_cms_page_section ON cms_variables (page, section);

-- 4. Atomic article view increment RPC (optional optimization used when available)
CREATE OR REPLACE FUNCTION increment_article_views(article_id BIGINT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE articles SET views_count = COALESCE(views_count, 0) + 1 WHERE id = article_id;
$$;
