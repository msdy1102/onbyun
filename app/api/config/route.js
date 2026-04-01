// app/api/config/route.js
// 공개 API — 인증 불필요, site_config의 landing_* 값 반환
// Landing.js가 클라이언트에서 fetch해서 어드민 편집 내용을 실제 페이지에 반영

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";

// Cache-Control: 60초 캐시 (CDN/브라우저 캐시로 성능 최적화)
export const revalidate = 60;

const DEFAULT_CONTENT = {
  hero_headline:        "서명하기 전,\n위험 조항부터 확인하세요",
  hero_subheadline:     "근로계약서·전세계약서·프리랜서 계약서 —\n어떤 계약서든 30초 안에 읽고, 위험한 조항 3가지를 짚어드립니다.",
  hero_badge:           "계약서 분석 · 121종 무료 제공 · 가입 30초",
  hero_cta_primary:     "내 계약서 확인하기",
  hero_cta_secondary:   "121종 목록 보기",
  contracts_title:      "받은 계약서를 클릭하면 바로 확인할 수 있어요",
  contracts_sub:        "취업·알바·전세·프리랜서 계약서마다 놓치기 쉬운 조항이 다릅니다.\n유형별로 위험 조항 상위 5개를 먼저 보여드립니다.",
  problem_title:        "서명하고 나서 알게 되는 것들",
  problem_review1_quote: "입사 6개월 만에 야근이 주 4회로 늘었는데, 계약서에 '포괄임금제'가 적혀 있어서 추가 수당을 하나도 못 받았어요. 서명 전에 그 조항이 뭔지 알았더라면...",
  problem_review1_name:  "김○○",
  problem_review1_role:  "직장인 1년차 · 서울",
  problem_review1_result:"월 40시간 초과근무 수당 0원",
  problem_review2_quote: "3줄짜리 특약이 문제였어요. '임차인 귀책 사유 시 보증금에서 수리비 우선 공제' — 이 한 문장 때문에 보증금 1,800만 원 중 340만 원을 못 돌려받았습니다.",
  problem_review2_name:  "이○○",
  problem_review2_role:  "직장인 29세 · 인천",
  problem_review2_result:"보증금 340만 원 미반환",
  problem_review3_quote: "3개월 작업한 브랜드 디자인인데, 계약서 제15조 한 줄로 포트폴리오에도 올릴 수 없게 됐어요. 클라이언트가 '업계 표준'이라고 해서 그냥 믿었는데.",
  problem_review3_name:  "박○○",
  problem_review3_role:  "프리랜서 디자이너 3년차",
  problem_review3_result:"3개월 작업물 저작권 전부 상실",
  hiw_title:            "파일 올리고 30초, 끝입니다",
  hiw_sub:              "앱 설치 없이, 회원가입 없이도 바로 확인됩니다. 이메일 가입은 30초면 충분합니다.",
  proof_title:          "계약서 서명 전날 밤, 가장 많이 찾습니다",
  proof_review1_quote:  "입사 전날 밤에 근로계약서를 올렸는데 포괄임금제 조항을 잡아줬어요. 다음날 HR 담당자한테 연락해서 해당 조항을 삭제하고 서명했습니다.",
  proof_review1_name:   "김○○",
  proof_review1_role:   "신입사원 26세",
  proof_review1_result: "포괄임금제 조항 1개 삭제 후 입사",
  proof_review2_quote:  "계약 전날 밤 11시에 전세계약서 PDF를 올렸어요. 3번째 특약 조항이 집주인한테만 유리하다고 정확히 짚어줘서 다음날 계약 자리에서 그 문장 빼달라고 요청했고 통했습니다.",
  proof_review2_name:   "이○○",
  proof_review2_role:   "직장인 31세",
  proof_review2_result: "특약 조항 1개 삭제 후 계약 체결",
  proof_review3_quote:  "프리랜서 3년차인데 계약서를 제대로 읽은 게 사실 이번이 처음이에요. IP 귀속 조항이 위험하다고 뜨길래 '작업물 원본 파일은 저작권 귀속에서 제외' 한 문장을 추가 협의해서 넣었습니다.",
  proof_review3_name:   "박○○",
  proof_review3_role:   "프리랜서 개발자",
  proof_review3_result: "IP 귀속 예외 조항 1건 협의 추가",
  pricing_title:        "체크리스트는 무료, AI 분석은 월 9,900원",
  pricing_sub:          "계약서 체크리스트 121종은 가입 없이 영구 무료입니다.\nAI 분석이 하루 1회 이상 필요하다면 스탠다드를 추천합니다.",
  faq_title:            "혹시 이런 게 걱정되시나요?",
  cta_headline:         "계약서 앞에서\n더 이상 을(乙)이 되지 않도록",
  cta_sub:              "지금 올리면 18초 후에 결과가 나옵니다.\n카드 등록 없이, 첫 분석은 무료입니다.",
  section_order:        null,
  section_hidden:       null,
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_config")
      .select("key, value")
      .or("key.like.landing_%,key.eq.section_order,key.eq.section_hidden");

    if (error) throw error;

    const result = { ...DEFAULT_CONTENT };
    (data || []).forEach(row => {
      if (row.key === "section_order" || row.key === "section_hidden") {
        try { result[row.key] = JSON.parse(row.value); } catch {}
      } else {
        const k = row.key.replace("landing_", "");
        if (k in result) result[k] = row.value;
      }
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    // Supabase 오류 시 기본값 반환 — 사이트 정상 작동 보장
    return NextResponse.json(DEFAULT_CONTENT, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }
}
