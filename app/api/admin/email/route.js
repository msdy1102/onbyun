import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../../lib/supabase";
import { sendEmail, buildLegalAlertEmail, buildServiceUpdateEmail } from "../../../../lib/mailer";
import { logAdminAction } from "../../../../lib/admin-audit";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const { type, lawName, summary, link, title, content, ctaText, ctaUrl } = body;

  if (!type || !["legal_alert", "service_update"].includes(type)) {
    return NextResponse.json({ error: "type은 legal_alert 또는 service_update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 이메일 수신 동의 유저 목록 조회
  const field = type === "legal_alert" ? "email_legal" : "email_marketing";
  const { data: users, error } = await supabase
    .from("users")
    .select("email, nickname, name")
    .eq(field, true);

  if (error || !users?.length) {
    return NextResponse.json({ error: "수신 대상 없음", count: 0 }, { status: 200 });
  }

  // 개별 발송 (실제 서비스에서는 Resend Batch API 권장)
  let sent = 0, failed = 0;
  for (const user of users) {
    const nickname = user.nickname || user.name?.split(" ")[0] || "고객";
    const emailContent = type === "legal_alert"
      ? buildLegalAlertEmail({ nickname, lawName, summary, link })
      : buildServiceUpdateEmail({ nickname, title, body: content, ctaText, ctaUrl });

    const result = await sendEmail({ to: user.email, ...emailContent });
    if (result.ok) sent++; else failed++;
  }

  await logAdminAction(
    session.user.id,
    `SEND_EMAIL_${type.toUpperCase()}`,
    "admin/email",
    { type, sent, failed, total: users.length }
  );

  return NextResponse.json({ ok: true, sent, failed, total: users.length });
}
