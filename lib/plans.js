/**
 * 서버 기준 플랜 금액표
 * 결제 승인 시 클라이언트가 전달한 금액이 아닌,
 * 이 상수를 기준으로 재검증한다.
 */
export const PLAN_PRICES = {
  standard: 9900,
  standard_yearly: 7900 * 12, // 94,800원
  pro: 29900,
  pro_yearly: 24900 * 12, // 298,800원
};

export const PLAN_NAMES = {
  standard: "온변 스탠다드",
  standard_yearly: "온변 스탠다드 (연간)",
  pro: "온변 프로",
  pro_yearly: "온변 프로 (연간)",
};

// 무료 플랜 월 분석 횟수 제한
export const FREE_MONTHLY_LIMIT = 1;
