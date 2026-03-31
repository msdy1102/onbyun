-- ============================================================
-- 온변 Supabase 스키마 v1.0
-- Supabase SQL Editor에 전체 붙여넣고 실행하세요.
-- ============================================================

-- ── 확장 ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. users (NextAuth SupabaseAdapter가 자동 생성하지만 컬럼 추가) ──
-- NextAuth adapter가 기본 users 테이블을 생성하므로,
-- plan 컬럼만 ALTER로 추가합니다.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'standard', 'pro'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('standard', 'pro')),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'canceled', 'expired')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

-- ── 3. orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    TEXT NOT NULL UNIQUE,  -- 토스 orderId
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id     TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  payment_key TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'canceled')),
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. analysis_history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT '기타',
  risk          TEXT NOT NULL CHECK (risk IN ('safe', 'caution', 'danger')),
  summary       TEXT NOT NULL,
  key_points    JSONB NOT NULL DEFAULT '[]',
  warnings      JSONB NOT NULL DEFAULT '[]',
  expires_at    TIMESTAMPTZ,  -- NULL이면 무기한 (pro 플랜)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 만료된 기록 자동 삭제 (매일 자정, pg_cron 필요)
-- SELECT cron.schedule('delete-expired-history', '0 0 * * *',
--   $$DELETE FROM analysis_history WHERE expires_at < NOW()$$);

-- ── 5. admin_audit_logs (삭제 불가) ─────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,           -- 대상 리소스 (예: "user:abc123")
  detail     JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_log는 INSERT만 허용, UPDATE/DELETE 방지
CREATE OR REPLACE RULE no_update_audit_logs AS
  ON UPDATE TO admin_audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_logs AS
  ON DELETE TO admin_audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================

-- ── users ───────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: 본인만 조회" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: 본인만 수정" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ── subscriptions ────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: 본인만 조회" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 구독 변경은 서버(Service Role)만 가능 — 클라이언트 직접 수정 불가
-- (Service Role은 RLS 우회하므로 별도 정책 불필요)

-- ── orders ───────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: 본인만 조회" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- ── analysis_history ─────────────────────────────────────────
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history: 본인만 조회" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history: 본인만 삭제" ON analysis_history
  FOR DELETE USING (auth.uid() = user_id);

-- 히스토리 INSERT/UPDATE는 서버(Service Role)만 가능

-- ── admin_audit_logs ─────────────────────────────────────────
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 어드민만 조회 가능 (role 컬럼 기준)
CREATE POLICY "audit_logs: 어드민만 조회" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_expires ON analysis_history(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
