import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (Service Role Key 사용)
 * 절대 클라이언트 컴포넌트에서 import하지 않는다.
 * SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사 없이 서버에서만 사용.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("[온변] Supabase 환경변수가 설정되지 않았습니다.");
  }

  return createClient(url, key, {
    auth: {
      // 서버 측에서 사용하므로 세션 자동 저장 불필요
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
