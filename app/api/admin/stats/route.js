import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../../lib/supabase";
import { logAdminAction } from "../../../../lib/admin-audit";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0,0,0,0);

  try {
    const [
      { count: totalUsers },
      { count: totalAnalysis },
      { count: monthlyAnalysis },
      { count: freeUsers },
      { data: recentUsers },
      { data: recentAnalysis },
      { data: riskRows },
      { data: auditLogs },
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("analysis_history").select("id", { count: "exact", head: true }),
      supabase.from("analysis_history").select("id", { count: "exact", head: true })
        .gte("created_at", thisMonthStart.toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("plan", "free"),
      supabase.from("users").select("id, email, name, nickname, plan, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("analysis_history").select("id, user_id, contract_type, risk, summary, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("analysis_history").select("risk").limit(500),
      supabase.from("admin_audit_logs").select("id, admin_id, action, target, created_at").order("created_at", { ascending: false }).limit(20),
    ]);

    const riskBreakdown = { safe: 0, caution: 0, danger: 0 };
    (riskRows || []).forEach(r => { if (riskBreakdown[r.risk] !== undefined) riskBreakdown[r.risk]++; });

    await logAdminAction(session.user.id, "VIEW_STATS", "admin/stats");

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        totalAnalysis: totalAnalysis ?? 0,
        monthlyAnalysis: monthlyAnalysis ?? 0,
        freeUsers: freeUsers ?? 0,
        paidUsers: (totalUsers ?? 0) - (freeUsers ?? 0),
      },
      riskBreakdown,
      recentUsers: recentUsers || [],
      recentAnalysis: recentAnalysis || [],
      auditLogs: auditLogs || [],
    });
  } catch (e) {
    console.error("[admin/stats]", e);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
