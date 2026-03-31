-- ═══════════════════════════════════════════════════════
-- 온변 users 테이블 컬럼 추가 마이그레이션
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

-- 닉네임 (1~20자, 한글/영문/숫자/하이픈)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 마케팅 이메일 수신 동의 (선택, 기본 false)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT false;

-- 법령 변경 이메일 수신 동의 (기본 true)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_legal BOOLEAN DEFAULT true;

-- 신규 유저 여부 (온보딩 완료 시 false로 변경)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_new_user BOOLEAN DEFAULT true;

-- 가입일 (최초 INSERT 시 자동 설정)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 닉네임 길이 제약 (DB 레벨 보호)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_nickname_length;
ALTER TABLE users
  ADD CONSTRAINT users_nickname_length CHECK (
    nickname IS NULL OR (char_length(nickname) >= 1 AND char_length(nickname) <= 20)
  );

-- 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════
-- analysis_history 테이블 생성 (AI 분석 히스토리)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS analysis_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type TEXT,
  risk          TEXT CHECK (risk IN ('safe','caution','danger')),
  summary       TEXT,
  key_points    JSONB DEFAULT '[]',
  warnings      JSONB DEFAULT '[]',
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 유저별 최신순 조회
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_created
  ON analysis_history(user_id, created_at DESC);

-- RLS 활성화
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 데이터만 읽기/쓰기
DROP POLICY IF EXISTS "analysis_history_select_own" ON analysis_history;
CREATE POLICY "analysis_history_select_own"
  ON analysis_history FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "analysis_history_insert_own" ON analysis_history;
CREATE POLICY "analysis_history_insert_own"
  ON analysis_history FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- 만료된 레코드 자동 삭제 (선택 — pg_cron 활성화 필요)
-- SELECT cron.schedule('cleanup-expired-history', '0 3 * * *',
--   $$DELETE FROM analysis_history WHERE expires_at < NOW()$$);

-- 확인
SELECT COUNT(*) as total_rows FROM analysis_history;
