import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { FREE_MONTHLY_LIMIT } from "../../../lib/plans";

// ── GET: 히스토리 목록 조회 ──────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 10;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  try {
    const { data, error, count } = await supabase
      .from("analysis_history")
      .select("id, contract_type, risk, summary, created_at", { count: "exact" })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ items: data, total: count, page, limit });
  } catch (e) {
    console.error("[온변] 히스토리 조회 오류:", e);
    return NextResponse.json({ error: "히스토리를 불러오지 못했습니다." }, { status: 500 });
  }
}

// ── POST: 분석 결과 저장 ──────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { contractType, risk, summary, keyPoints, warnings } = body;
  if (!risk || !summary) {
    return NextResponse.json({ error: "분석 결과가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const plan = session.user.plan ?? "free";

    // 무료 플랜: 이번 달 사용 횟수 확인
    if (plan === "free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("analysis_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (count >= FREE_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: `무료 플랜은 월 ${FREE_MONTHLY_LIMIT}회까지 분석할 수 있어요. 업그레이드 후 무제한 사용하세요.`, upgradeRequired: true },
          { status: 403 }
        );
      }
    }

    // 스탠다드: 30일 보관 정책 (만료 날짜 기록)
    const expiresAt = plan === "standard"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null; // pro는 무기한

    const { data, error } = await supabase
      .from("analysis_history")
      .insert({
        user_id: session.user.id,
        contract_type: contractType || "기타",
        risk,
        summary,
        key_points: keyPoints ?? [],
        warnings: warnings ?? [],
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });

  } catch (e) {
    console.error("[온변] 히스토리 저장 오류:", e);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
