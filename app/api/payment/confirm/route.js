import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../../lib/supabase";
import { PLAN_PRICES, PLAN_NAMES } from "../../../../lib/plans";
import { checkPaymentLimit } from "../../../../lib/rate-limit";

export async function POST(req) {
  // ① 인증 확인
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // Rate Limit (userId당 분당 3회 — Upstash Redis 또는 메모리 기반)
  const { success: rateLimitOk } = await checkPaymentLimit(session.user.id);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { paymentKey, orderId, amount, planId } = body;

  // ② 입력값 검증
  if (!paymentKey || !orderId || !amount || !planId) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "잘못된 금액입니다." }, { status: 400 });
  }

  // ③ 서버 기준 금액 재검증 (클라이언트 변조 방지)
  const expectedAmount = PLAN_PRICES[planId];
  if (!expectedAmount) {
    return NextResponse.json({ error: "존재하지 않는 플랜입니다." }, { status: 400 });
  }
  if (amount !== expectedAmount) {
    console.error("[온변] 결제 금액 불일치:", { planId, expected: expectedAmount, received: amount, userId: session.user.id });
    return NextResponse.json({ error: "결제 금액이 올바르지 않습니다." }, { status: 400 });
  }

  const tossSecretKey = process.env.TOSS_SECRET_KEY;
  if (!tossSecretKey) {
    console.error("[온변] TOSS_SECRET_KEY 환경변수 미설정");
    return NextResponse.json({ error: "서비스 설정 오류입니다." }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // ④ orderId 중복 처리 방지
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status")
      .eq("order_id", orderId)
      .single();

    if (existing?.status === "paid") {
      return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
    }

    // ⑤ 토스페이먼츠 최종 승인 요청
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(tossSecretKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error("[온변] 토스 승인 실패:", tossData.code, tossData.message);
      return NextResponse.json({ error: "결제 승인에 실패했습니다. 다시 시도해주세요." }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    // 연간 플랜이면 12개월, 월간이면 1개월
    const isYearly = planId.endsWith("_yearly");
    expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));

    // ⑥ 주문 기록 저장
    await supabase.from("orders").upsert({
      order_id: orderId,
      user_id: session.user.id,
      plan_id: planId,
      amount,
      payment_key: paymentKey,
      status: "paid",
      paid_at: now.toISOString(),
    });

    // ⑦ 구독 활성화
    await supabase.from("subscriptions").upsert({
      user_id: session.user.id,
      plan: planId.replace("_yearly", ""), // "standard" 또는 "pro"
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "user_id" });

    // ⑧ users.plan 컬럼 동기화 (분석 횟수 제한 체크에 사용됨)
    await supabase
      .from("users")
      .update({ plan: planId.replace("_yearly", "") })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true, plan: planId });

  } catch (e) {
    console.error("[온변] 결제 처리 오류:", e);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
