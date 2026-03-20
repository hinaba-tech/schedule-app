-- ========================================
-- スケジュール調整アプリ データベーススキーマ
-- Supabase で実行してください
-- ========================================

-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_calendar_id TEXT DEFAULT 'primary',
  slack_webhook_url TEXT,
  zoom_access_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- スケジューリングリンクテーブル
CREATE TABLE scheduling_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location_type TEXT NOT NULL DEFAULT 'google_meet',
  location_detail TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  availability_rules JSONB NOT NULL DEFAULT '[]',
  buffer_before_minutes INTEGER NOT NULL DEFAULT 0,
  buffer_after_minutes INTEGER NOT NULL DEFAULT 0,
  min_notice_hours INTEGER NOT NULL DEFAULT 24,
  max_days_ahead INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- 予約テーブル
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduling_link_id UUID NOT NULL REFERENCES scheduling_links(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_company TEXT,
  guest_phone TEXT,
  notes TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  google_event_id TEXT,
  meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 候補提案テーブル（投票型・確認型）
CREATE TABLE schedule_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location_type TEXT NOT NULL DEFAULT 'google_meet',
  location_detail TEXT,
  type TEXT NOT NULL DEFAULT 'confirmation', -- 'confirmation' or 'voting'
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  confirmed_candidate_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 候補日時テーブル
CREATE TABLE proposal_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES schedule_proposals(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL
);

-- 回答テーブル
CREATE TABLE proposal_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES schedule_proposals(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 投票テーブル
CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES proposal_responses(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES proposal_candidates(id) ON DELETE CASCADE,
  availability TEXT NOT NULL DEFAULT 'available' -- 'available', 'maybe', 'unavailable'
);

-- インデックス
CREATE INDEX idx_scheduling_links_user_id ON scheduling_links(user_id);
CREATE INDEX idx_scheduling_links_slug ON scheduling_links(slug);
CREATE INDEX idx_bookings_scheduling_link_id ON bookings(scheduling_link_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_proposals_user_id ON schedule_proposals(user_id);
CREATE INDEX idx_proposal_candidates_proposal_id ON proposal_candidates(proposal_id);
CREATE INDEX idx_proposal_responses_proposal_id ON proposal_responses(proposal_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- 公開読み取り用ポリシー（予約ページから読めるように）
CREATE POLICY "Public read scheduling_links" ON scheduling_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read proposal_candidates" ON proposal_candidates
  FOR SELECT USING (true);

CREATE POLICY "Public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Public insert proposal_responses" ON proposal_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public insert proposal_votes" ON proposal_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read schedule_proposals" ON schedule_proposals
  FOR SELECT USING (status = 'open');

-- 認証ユーザー用ポリシー
CREATE POLICY "Users manage own data" ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Users manage own links" ON scheduling_links
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users read own bookings" ON bookings
  FOR SELECT USING (
    scheduling_link_id IN (
      SELECT id FROM scheduling_links WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own proposals" ON schedule_proposals
  FOR ALL USING (user_id = auth.uid());

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scheduling_links_updated_at
  BEFORE UPDATE ON scheduling_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
