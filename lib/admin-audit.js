/**
 * admin_audit_logs 테이블에 어드민 행위를 기록합니다.
 * 삭제 불가 정책 — INSERT만 허용, 서버에서만 호출
 */
import { getSupabaseAdmin } from "./supabase";

/**
 * @param {string} adminId  - 어드민 유저 ID
 * @param {string} action   - 행위 코드 (예: VIEW_STATS, CHANGE_PLAN, DELETE_USER)
 * @param {string} target   - 대상 리소스 (예: "users/abc123")
 * @param {object} [meta]   - 추가 메타데이터
 */
export async function logAdminAction(adminId, action, target = "", meta = {}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_audit_logs").insert({
      admin_id:   adminId,
      action,
      target,
      meta,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // 감사 로그 실패는 본 기능을 막지 않음 — 오류만 기록
    console.error("[audit-log] 기록 실패:", e?.message);
  }
}
