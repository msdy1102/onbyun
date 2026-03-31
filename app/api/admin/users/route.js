import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../../lib/supabase";
import { logAdminAction } from "../../../../lib/admin-audit";

// 허용 plan 목록
const VALID_PLANS = ["free", "standard", "standard_yearly", "pro", "pro_yearly"];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const q = searchParams.get("q") || "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();
  let query = supabase.from("users")
    .select("id, email, name, nickname, plan, role, created_at, last_login", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,nickname.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });

  return NextResponse.json({ items: data, total: count, page, limit });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const { userId, plan } = body;
  if (!userId) return NextResponse.json({ error: "userId 필요" }, { status: 400 });
  if (plan && !VALID_PLANS.includes(plan)) return NextResponse.json({ error: "유효하지 않은 플랜" }, { status: 400 });

  const updates = {};
  if (plan !== undefined) updates.plan = plan;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });

  await logAdminAction(session.user.id, "UPDATE_USER_PLAN", `users/${userId}`, { plan });

  return NextResponse.json({ ok: true });
}
