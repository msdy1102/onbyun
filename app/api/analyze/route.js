import { NextResponse } from "next/server";

// Rate limiting (간단한 메모리 기반 — 프로덕션에서는 Redis 사용 권장)
const rateLimitMap = new Map();
const RATE_LIMIT = 5;        // 분당 최대 요청 수
const RATE_WINDOW = 60000;   // 1분

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

export async function POST(req) {
  // Rate limit 체크
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { text, contractType } = body;

  // 입력값 검증
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "계약서 내용을 입력해주세요." }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: "계약서 내용이 너무 깁니다. 8,000자 이하로 입력해주세요." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[온변] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    return NextResponse.json({ error: "서비스 설정 오류입니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  const typeHint = contractType ? `계약서 종류: ${contractType}\n\n` : "";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: `당신은 한국 법률 계약서 분석 전문가입니다. 사용자가 붙여넣은 계약서나 약관을 분석해 핵심 내용을 쉽게 설명해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
{
  "type": "계약서 종류 (예: 근로계약서, 프리랜서 계약서 등)",
  "risk": "safe 또는 caution 또는 danger",
  "summary": "이 계약서는 OOO입니다. 전반적으로 [무난함/주의 필요/위험]합니다. (2문장 이내)",
  "keyPoints": [
    { "level": "info 또는 warn 또는 danger", "title": "항목명", "desc": "쉬운 설명" }
  ],
  "warnings": [
    { "clause": "조항명 또는 조항번호", "desc": "위험한 이유와 대응 방법을 쉬운 말로 설명" }
  ]
}

keyPoints는 5~8개, warnings는 위험/주의 조항만 포함(없으면 빈 배열).
일반인도 이해할 수 있는 쉬운 한국어로 작성하세요.`,
        messages: [{ role: "user", content: `${typeHint}다음 계약서를 분석해주세요:\n\n${text}` }],
      }),
    });

    if (!res.ok) {
      console.error("[온변] Anthropic API 오류:", res.status);
      return NextResponse.json({ error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.content?.map(c => c.text).join("") || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return NextResponse.json(parsed);

  } catch (e) {
    // 에러 상세 내용은 서버 로그에만 기록
    console.error("[온변] 분석 오류:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 계약서 내용을 확인 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
