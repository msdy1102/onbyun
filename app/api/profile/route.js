import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../lib/supabase";

// ── GET: 프로필 조회 ──────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, nickname, image, plan, is_new_user, email_marketing, email_legal, created_at, last_login")
      .eq("id", session.user.id)
      .single();

    if (error) throw error;
    return Response.json({ user: data });
  } catch (e) {
    console.error("[profile GET]", e);
    return Response.json({ error: "프로필 조회 실패" }, { status: 500 });
  }
}

// ── PATCH: 프로필 수정 ────────────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 허용 필드만 추출 (화이트리스트)
  const allowed = ["nickname", "email_marketing", "email_legal", "is_new_user"];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // 닉네임 유효성 검사
  if (updates.nickname !== undefined) {
    const nick = String(updates.nickname).trim();
    if (nick.length < 1 || nick.length > 20) {
      return Response.json({ error: "닉네임은 1~20자 사이여야 합니다." }, { status: 400 });
    }
    // 특수문자 제한 (한글, 영문, 숫자, 언더스코어, 하이픈만 허용)
    if (!/^[\w\uAC00-\uD7A3\s-]+$/.test(nick)) {
      return Response.json({ error: "닉네임에 허용되지 않는 문자가 포함되어 있습니다." }, { status: 400 });
    }
    updates.nickname = nick;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id);

    if (error) throw error;
    return Response.json({ ok: true, updates });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return Response.json({ error: "프로필 저장 실패" }, { status: 500 });
  }
}
