// app/api/admin/content/route.js
// 랜딩 페이지 섹션 텍스트 콘텐츠 GET/PATCH
// Supabase site_config 테이블 사용 (key-value 방식)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getSupabaseAdmin } from "../../../../lib/supabase";
import { logAdminAction } from "../../../../lib/admin-audit";

// 기본 콘텐츠값 (테이블이 비어있을 때 폴백)
const DEFAULT_CONTENT = {
  hero_headline:    "서명하기 전,\n위험 조항부터 확인하세요",
  hero_subheadline: "근로계약서·전세계약서·프리랜서 계약서 —\n어떤 계약서든 30초 안에 읽고, 위험한 조항 3가지를 짚어드립니다.",
  hero_badge:       "계약서 분석 · 121종 무료 제공 · 가입 30초",
  hero_cta_primary: "내 계약서 확인하기",
  hero_cta_secondary: "121종 목록 보기",
  contracts_title:  "받은 계약서를 클릭하면 바로 확인할 수 있어요",
  contracts_sub:    "취업·알바·전세·프리랜서 계약서마다 놓치기 쉬운 조항이 다릅니다.\n유형별로 위험 조항 상위 5개를 먼저 보여드립니다.",
  hiw_title:        "파일 올리고 30초, 끝입니다",
  hiw_sub:          "앱 설치 없이, 회원가입 없이도 바로 확인됩니다. 이메일 가입은 30초면 충분합니다.",
  proof_title:      "계약서 서명 전날 밤, 가장 많이 찾습니다",
  faq_title:        "혹시 이런 게 걱정되시나요?",
  cta_headline:     "계약서 앞에서\n더 이상 을(乙)이 되지 않도록",
  cta_sub:          "지금 올리면 18초 후에 결과가 나옵니다.\n카드 등록 없이, 첫 분석은 무료입니다.",
  pricing_title:    "체크리스트는 무료, AI 분석은 월 9,900원",
  pricing_sub:      "계약서 체크리스트 121종은 가입 없이 영구 무료입니다.\nAI 분석이 하루 1회 이상 필요하다면 스탠다드를 추천합니다.",
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("key, value")
      .like("key", "landing_%");

    if (error) throw error;

    // DB 값을 객체로 변환, 없는 키는 기본값으로
    const result = { ...DEFAULT_CONTENT };
    (data || []).forEach(row => {
      const k = row.key.replace("landing_", "");
      if (k in result) result[k] = row.value;
    });

    return NextResponse.json({ success: true, content: result, defaults: DEFAULT_CONTENT });
  } catch (e) {
    // site_config 테이블이 없을 경우 기본값 반환
    return NextResponse.json({ success: true, content: DEFAULT_CONTENT, defaults: DEFAULT_CONTENT });
  }
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { key, value } = body;
  if (!key || typeof value !== "string") {
    return NextResponse.json({ error: "key, value 필요" }, { status: 400 });
  }
  if (!(key in DEFAULT_CONTENT)) {
    return NextResponse.json({ error: "허용되지 않은 key" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const { error } = await supabase
      .from("site_config")
      .upsert({ key: `landing_${key}`, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) throw error;

    await logAdminAction(session.user.id, "UPDATE_LANDING_CONTENT", `landing_${key}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
