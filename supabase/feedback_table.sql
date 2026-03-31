-- ============================================================
-- 온변 feedback 테이블
-- Supabase SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   TEXT NOT NULL DEFAULT '기타'
               CHECK (category IN ('정보 오류', '기능 오작동', 'UI/UX 불편', '콘텐츠 요청', '기타')),
  text       TEXT NOT NULL CHECK (char_length(text) <= 500),
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- INSERT: 누구나 가능 (비로그인 유저도 제보 가능)
CREATE POLICY "feedback_insert"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- SELECT: service_role만 가능 (어드민만 조회)
-- 별도 정책 없음 = anon/authenticated 조회 불가

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
