import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "../../../../lib/supabase";

/**
 * 토스페이먼츠 웹훅 수신 엔드포인트
 * TODO: 토스페이먼츠 대시보드 → 웹훅 URL 등록:
 *   https://onbyun.vercel.app/api/payment/webhook
 *   TOSS_WEBHOOK_SECRET 환경변수 설정 필요
 */

export async function POST(req) {
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[온변] TOSS_WEBHOOK_SECRET 환경변수 미설정");
    return NextResponse.json({ error: "설정 오류" }, { status: 500 });
  }

  // ① 원본 body를 버퍼로 읽기 (HMAC 검증에 필요)
  const rawBody = await req.text();

  // ② 토스 서명 헤더 추출
  const tossSignature = req.headers.get("toss-signature");
  if (!tossSignature) {
    console.warn("[온변] 웹훅 서명 헤더 없음");
    return NextResponse.json({ error: "서명 없음" }, { status: 401 });
  }

  // ③ HMAC-SHA256 서명 검증
  const expectedSig = createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  // 타이밍 공격 방지를 위해 상수 시간 비교 사용
  const sigBuf = Buffer.from(tossSignature, "base64");
  const expectedBuf = Buffer.from(expectedSig, "base64");

  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    console.warn("[온변] 웹훅 서명 검증 실패");
    return NextResponse.json({ error: "서명 불일치" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // ④ 이벤트 타입별 처리
    switch (event.eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { orderId, status } = event.data;

        if (status === "CANCELED" || status === "PARTIAL_CANCELED") {
          // 환불: 구독 비활성화
          const { data: order } = await supabase
            .from("orders")
            .select("user_id")
            .eq("order_id", orderId)
            .single();

          if (order?.user_id) {
            await supabase
              .from("subscriptions")
              .update({ status: "canceled", canceled_at: new Date().toISOString() })
              .eq("user_id", order.user_id);
          }

          await supabase
            .from("orders")
            .update({ status: "canceled" })
            .eq("order_id", orderId);
        }
        break;
      }

      default:
        // 알 수 없는 이벤트는 무시하고 200 반환 (재전송 방지)
        break;
    }

    return NextResponse.json({ received: true });

  } catch (e) {
    console.error("[온변] 웹훅 처리 오류:", e);
    // 5xx 반환 시 토스가 재전송 → 멱등성 처리를 위해 200 반환
    return NextResponse.json({ received: true });
  }
}
