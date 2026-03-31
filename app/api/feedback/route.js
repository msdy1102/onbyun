// app/api/feedback/route.js
// 불편사항 접수 → Supabase feedback 테이블에 저장
// 클라이언트에서 직접 Supabase 호출 금지 — 서버에서만 처리

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";

const VALID_CATEGORIES = ["정보 오류", "기능 오작동", "UI/UX 불편", "콘텐츠 요청", "기타"];

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const { category, text } = body;

  // 입력값 검증
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ success: false, message: "내용을 입력해주세요." }, { status: 400 });
  }
  if (text.trim().length > 500) {
    return NextResponse.json({ success: false, message: "500자 이내로 입력해주세요." }, { status: 400 });
  }

  const safeCategory = VALID_CATEGORIES.includes(category) ? category : "기타";

  // IP 수집 (어뷰징 방지용)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("feedback").insert({
      category:   safeCategory,
      text:       text.trim(),
      ip,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[feedback] Supabase 저장 오류:", error);
      return NextResponse.json({ success: false, message: "저장에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback] 서버 오류:", err);
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
