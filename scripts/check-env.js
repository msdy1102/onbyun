/**
 * prebuild 환경변수 점검 스크립트
 * npm run build 전에 자동 실행됩니다.
 * 누락된 필수 환경변수가 있으면 빌드를 중단합니다.
 */

const REQUIRED_SERVER = [
  "ANTHROPIC_API_KEY",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TOSS_SECRET_KEY",
  "TOSS_WEBHOOK_SECRET",
];

// 클라이언트 노출 금지 키워드 — 번들에 포함되면 안 되는 패턴
const FORBIDDEN_IN_CLIENT = [
  "SECRET_KEY",
  "SERVICE_ROLE",
  "ANTHROPIC_API_KEY",
  "TOSS_SECRET",
  "NEXTAUTH_SECRET",
];

let hasError = false;

// ① 필수 서버 환경변수 존재 여부 확인
console.log("\n🔍 환경변수 점검 시작...\n");

const missing = REQUIRED_SERVER.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("❌ 누락된 필수 환경변수:");
  missing.forEach((key) => console.error(`   - ${key}`));
  hasError = true;
} else {
  console.log("✅ 필수 서버 환경변수 확인 완료");
}

// ② NEXT_PUBLIC_ 변수에 시크릿 키워드 포함 여부 확인
const publicKeys = Object.keys(process.env).filter((k) =>
  k.startsWith("NEXT_PUBLIC_")
);

const leaked = publicKeys.filter((key) =>
  FORBIDDEN_IN_CLIENT.some((forbidden) =>
    key.toUpperCase().includes(forbidden.toUpperCase())
  )
);

if (leaked.length > 0) {
  console.error("\n🔴 NEXT_PUBLIC_ 변수에 시크릿 키워드 포함 — 즉시 수정 필요:");
  leaked.forEach((key) => console.error(`   - ${key}`));
  hasError = true;
} else {
  console.log("✅ NEXT_PUBLIC_ 변수 보안 확인 완료");
}

if (hasError) {
  console.error("\n빌드를 중단합니다. 위 항목을 확인해주세요.\n");
  process.exit(1);
} else {
  console.log("\n✅ 모든 환경변수 점검 통과\n");
}
