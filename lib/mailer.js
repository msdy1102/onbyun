/**
 * 이메일 발송 유틸 — Resend API 사용
 * 환경변수: RESEND_API_KEY, RESEND_FROM (예: "온변 <noreply@onbyun.com>")
 */

const RESEND_API = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM || "온변 <noreply@onbyun.com>";

/**
 * 이메일 1건 발송
 */
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY 미설정 — 이메일 발송 건너뜀");
    return { ok: false, reason: "no_api_key" };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, text }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[mailer] Resend 오류:", res.status, data);
      return { ok: false, reason: data?.message || "resend_error" };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[mailer] 발송 실패:", e);
    return { ok: false, reason: e.message };
  }
}

/**
 * 법령 변경 알림 이메일 템플릿
 */
export function buildLegalAlertEmail({ nickname, lawName, summary, link }) {
  return {
    subject: `[온변] 법령 변경 알림 — ${lawName}`,
    html: `
<div style="font-family:Apple SD Gothic Neo,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
  <div style="font-size:22px;font-weight:700;color:#5385E4;margin-bottom:8px;">온변</div>
  <hr style="border:none;border-top:1px solid #e8e8e8;margin-bottom:24px;">
  <p style="font-size:15px;color:#333;margin-bottom:8px;">안녕하세요, <strong>${nickname || "고객"}</strong>님</p>
  <p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:20px;">
    관심 법령이 변경됐습니다. 계약서 작성이나 근로계약에 영향을 줄 수 있으니 확인해보세요.
  </p>
  <div style="background:#f0f4fe;border-left:4px solid #5385E4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:15px;font-weight:700;color:#2d5bbf;margin-bottom:6px;">📋 ${lawName}</div>
    <div style="font-size:14px;color:#444;line-height:1.65;">${summary}</div>
  </div>
  ${link ? `<a href="${link}" style="display:inline-block;padding:12px 24px;background:#5385E4;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">자세히 보기 →</a>` : ""}
  <hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0 16px;">
  <p style="font-size:12px;color:#aaa;line-height:1.6;">
    이 메일은 온변 법령 변경 알림을 구독하셔서 발송됐습니다.<br>
    수신을 원치 않으시면 <a href="https://onbyun.vercel.app/mypage" style="color:#5385E4;">내 정보</a>에서 알림을 끄세요.
  </p>
</div>`,
    text: `[온변] ${lawName} 법령이 변경됐습니다.\n\n${summary}\n\n자세히 보기: ${link || "https://onbyun.vercel.app"}`,
  };
}

/**
 * 서비스 업데이트 이메일 템플릿
 */
export function buildServiceUpdateEmail({ nickname, title, body, ctaText, ctaUrl }) {
  return {
    subject: `[온변] ${title}`,
    html: `
<div style="font-family:Apple SD Gothic Neo,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
  <div style="font-size:22px;font-weight:700;color:#5385E4;margin-bottom:8px;">온변</div>
  <hr style="border:none;border-top:1px solid #e8e8e8;margin-bottom:24px;">
  <p style="font-size:15px;color:#333;margin-bottom:8px;">안녕하세요, <strong>${nickname || "고객"}</strong>님</p>
  <h2 style="font-size:20px;font-weight:700;color:#111;margin-bottom:12px;">${title}</h2>
  <div style="font-size:14px;color:#555;line-height:1.7;margin-bottom:24px;">${body}</div>
  ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#5385E4;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">${ctaText || "확인하기"} →</a>` : ""}
  <hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0 16px;">
  <p style="font-size:12px;color:#aaa;line-height:1.6;">
    이 메일은 온변 서비스 업데이트 알림을 구독하셔서 발송됐습니다.<br>
    수신을 원치 않으시면 <a href="https://onbyun.vercel.app/mypage" style="color:#5385E4;">내 정보</a>에서 알림을 끄세요.
  </p>
</div>`,
    text: `[온변] ${title}\n\n${body}\n\n${ctaUrl || "https://onbyun.vercel.app"}`,
  };
}
