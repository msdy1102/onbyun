import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { FREE_MONTHLY_LIMIT } from "../../../lib/plans";
import { checkAnalyzeLimit } from "../../../lib/rate-limit";

// ─── 계약서 유형별 특화 분석 포인트 ──────────────────────
const CONTRACT_FOCUS = {
  "근로계약서": `
집중 분석 항목:
- 임금(기본급·수당·포괄임금제 여부), 근로시간(초과근무·야간근로), 수습기간 조건
- 해고·퇴직 조항, 비밀유지·경업금지 범위와 기간
- 주휴수당·4대보험·퇴직금 관련 누락 또는 불리한 조항`,

  "프리랜서 계약서": `
집중 분석 항목:
- 저작권·지식재산권 귀속 조항 (발주사 귀속 시 위험)
- 대금 지급 시기·방식·지연 시 처리 방법
- 수정 횟수 제한, 추가 작업 무상 제공 조항
- 중도 해지 조건과 위약금, 비밀유지 의무 범위`,

  "임대차 계약서": `
집중 분석 항목:
- 보증금 반환 조건과 분쟁 시 처리 방법
- 수선·하자 책임 범위 (임대인 vs 임차인)
- 계약 갱신 요구권, 묵시적 갱신 조항
- 전입신고·확정일자 관련 특약, 원상복구 범위
- 근저당·압류 등 담보 위험 여부`,

  "이용약관": `
집중 분석 항목:
- 개인정보 수집·이용·제3자 제공 범위
- 자동결제·구독 해지 방법과 환불 정책
- 서비스 변경·중단 시 보상 여부
- 면책 범위가 지나치게 넓은 조항
- 분쟁 해결 조항 (중재 강제 등)`,

  "투자·주주 계약": `
집중 분석 항목:
- 지분 희석 방지 조항 (우선매수권·반희석 조항)
- 우선청산권·우선배당 조건
- 동반매도청구권·강제매도청구권 발동 조건
- 락업(Lock-up) 기간과 조건
- 이사회 구성·의결권·거부권 범위`,

  "기타": "",
};

// ─── 시스템 프롬프트 생성 ─────────────────────────────────
function buildSystemPrompt(contractType) {
  const focus = CONTRACT_FOCUS[contractType] || CONTRACT_FOCUS["기타"];

  return `당신은 한국 법률 계약서 분석 전문가입니다. 일반인도 쉽게 이해할 수 있도록 법률 용어 없이 설명해주세요.
${focus ? `\n${focus}\n` : ""}
반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요:
{
  "type": "계약서 종류 (예: 근로계약서, 프리랜서 계약서 등)",
  "risk": "safe 또는 caution 또는 danger",
  "summary": "이 계약서는 OOO입니다. 전반적으로 [무난함/주의 필요/위험]합니다. (2문장 이내, 쉬운 말로)",
  "keyPoints": [
    { "level": "info 또는 warn 또는 danger", "title": "항목명 (짧게)", "desc": "일반인이 이해할 수 있는 쉬운 설명. 문제가 있으면 대응 방법도 포함" }
  ],
  "warnings": [
    { "clause": "조항명 또는 조항번호", "desc": "왜 위험한지, 어떻게 대응해야 하는지 쉽게 설명" }
  ]
}

규칙:
- keyPoints: 5~8개 (위험>주의>확인 순으로 정렬)
- warnings: 위험/주의 조항만 포함. 없으면 빈 배열 []
- risk 판단 기준: safe(무난), caution(1~2개 주의 조항), danger(심각한 독소 조항 존재)
- 모든 설명은 중학생도 이해할 수 있는 쉬운 한국어로`;
}

// ─── POST 핸들러 ──────────────────────────────────────────
export async function POST(req) {
  // ① IP Rate Limit (분당 5회 — Upstash Redis 또는 메모리 기반)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
  const { success: rateLimitOk } = await checkAnalyzeLimit(ip);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // ② 로그인 확인
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있어요.", loginRequired: true },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  // ③ 월 사용 횟수 확인 (Supabase 기반 — 재배포해도 유지됨)
  const plan = session.user.plan ?? "free";
  if (plan === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("analysis_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          error: `무료 플랜은 월 ${FREE_MONTHLY_LIMIT}회까지 분석할 수 있어요. 업그레이드 후 무제한 사용하세요.`,
          dailyLimitExceeded: true,
        },
        { status: 429 }
      );
    }
  }

  // ④ 요청 본문 파싱
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { text, fileData, fileType } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[온변] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서비스 설정 오류입니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  const systemPrompt = buildSystemPrompt("기타");
  let userContent;

  if (fileType === "pdf" && fileData) {
    if (typeof fileData !== "string" || fileData.length < 100) {
      return NextResponse.json({ error: "PDF 파일을 읽을 수 없습니다." }, { status: 400 });
    }
    if (fileData.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF 파일이 너무 큽니다. 5MB 이하로 올려주세요." }, { status: 400 });
    }
    userContent = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: fileData },
      },
      { type: "text", text: "위 PDF 계약서를 분석해주세요." },
    ];
  } else if (fileType === "image" && fileData) {
    if (typeof fileData !== "string" || fileData.length < 100) {
      return NextResponse.json({ error: "이미지 파일을 읽을 수 없습니다." }, { status: 400 });
    }
    if (fileData.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지 파일이 너무 큽니다. 5MB 이하로 올려주세요." }, { status: 400 });
    }
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const mimeType = allowedMime.includes(body.mimeType) ? body.mimeType : "image/jpeg";
    userContent = [
      {
        type: "image",
        source: { type: "base64", media_type: mimeType, data: fileData },
      },
      { type: "text", text: "이 이미지에 있는 계약서 내용을 읽고 분석해주세요." },
    ];
  } else {
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "계약서 내용을 입력해주세요." }, { status: 400 });
    }
    if (text.trim().length < 50) {
      return NextResponse.json({ error: "계약서 내용이 너무 짧습니다. 더 많은 내용을 붙여넣어 주세요." }, { status: 400 });
    }
    if (text.length > 8000) {
      return NextResponse.json({ error: "계약서 내용이 너무 깁니다. 8,000자 이하로 입력해주세요." }, { status: 400 });
    }
    userContent = `다음 계약서를 분석해주세요:\n\n${text}`;
  }

  try {
    const apiHeaders = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      ...(fileType === "pdf" ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        model: "claude-sonnet-4-5",   // ✅ 수정: 올바른 모델명
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[온변] Anthropic API 오류:", res.status, errBody);
      return NextResponse.json(
        { error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    const data = await res.json();
    const raw = data.content?.map((c) => c.text).join("") || "";
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // ⑤ 분석 성공 시 Supabase에 사용 기록 저장 (기획서 17.3 RLS 정책 준수)
    const expiresAt =
      plan === "standard"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null; // pro·free는 무기한 또는 별도 정책

    await supabase.from("analysis_history").insert({
      user_id:       session.user.id,
      contract_type: parsed.type || "기타",
      risk:          parsed.risk,
      summary:       parsed.summary,
      key_points:    parsed.keyPoints ?? [],
      warnings:      parsed.warnings ?? [],
      expires_at:    expiresAt,
    });

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[온변] 분석 오류:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 계약서 내용을 확인 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
