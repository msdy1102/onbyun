-- ============================================================
-- 온변 Supabase 스키마 v2.0
-- Supabase SQL Editor에 전체 붙여넣고 실행하세요.
-- ============================================================

-- ── 확장 ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. users ─────────────────────────────────────────────────
-- auth.users 기반 프로필 테이블 (NextAuth 로그인 시 자동 upsert)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  image       TEXT,
  provider    TEXT NOT NULL DEFAULT 'google',
  role        TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  plan        TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'standard', 'pro')),
  last_login  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('standard', 'pro')),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'canceled', 'expired')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

-- ── 3. orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    TEXT NOT NULL UNIQUE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id     TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  payment_key TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'canceled')),
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. analysis_history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT '기타',
  risk          TEXT NOT NULL CHECK (risk IN ('safe', 'caution', 'danger')),
  summary       TEXT NOT NULL,
  key_points    JSONB NOT NULL DEFAULT '[]',
  warnings      JSONB NOT NULL DEFAULT '[]',
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. feedback ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   TEXT NOT NULL DEFAULT '기타'
               CHECK (category IN ('정보 오류', '기능 오작동', 'UI/UX 불편', '콘텐츠 요청', '기타')),
  text       TEXT NOT NULL CHECK (char_length(text) <= 500),
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. admin_audit_logs (삭제 불가) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_log는 INSERT만 허용, UPDATE/DELETE 방지
CREATE OR REPLACE RULE no_update_audit_logs AS
  ON UPDATE TO public.admin_audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_logs AS
  ON DELETE TO public.admin_audit_logs DO INSTEAD NOTHING;

-- ── 7. auth 연동 트리거 ──────────────────────────────────────
-- Supabase Auth 가입 시 public.users에 자동으로 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────
CREATE POLICY "users: 본인만 조회" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: 본인만 수정" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ── subscriptions ────────────────────────────────────────────
CREATE POLICY "subscriptions: 본인만 조회" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE는 service_role만 가능 (정책 없음 = 클라이언트 차단)

-- ── orders ───────────────────────────────────────────────────
CREATE POLICY "orders: 본인만 조회" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- ── analysis_history ─────────────────────────────────────────
CREATE POLICY "history: 본인만 조회" ON public.analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history: 본인만 삭제" ON public.analysis_history
  FOR DELETE USING (auth.uid() = user_id);
-- INSERT/UPDATE는 service_role만 가능

-- ── feedback ─────────────────────────────────────────────────
CREATE POLICY "feedback: 누구나 제보 가능" ON public.feedback
  FOR INSERT WITH CHECK (true);
-- SELECT는 service_role만 가능 (어드민만 조회)

-- ── admin_audit_logs ─────────────────────────────────────────
CREATE POLICY "audit_logs: 어드민만 조회" ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_history_user_id  ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created  ON public.analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_expires  ON public.analysis_history(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_id  ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login DESC);
