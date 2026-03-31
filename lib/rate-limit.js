/**
 * 메모리 기반 IP Rate Limiter
 * Serverless 환경(Vercel)에서는 인스턴스가 분리될 수 있으므로
 * 완전한 제어가 필요하면 Upstash Redis로 교체 권장.
 * 현재 설정: IP당 분당 5회
 */

const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 5;       // 분당 최대 요청 수

// 메모리 캐시: { ip -> { count, windowStart } }
const cache = new Map();

function cleanup() {
  const now = Date.now();
  for (const [ip, data] of cache.entries()) {
    if (now - data.windowStart > WINDOW_MS * 2) cache.delete(ip);
  }
}

export async function checkAnalyzeLimit(ip) {
  const now = Date.now();
  if (Math.random() < 0.1) cleanup();

  const entry = cache.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    cache.set(ip, { count: 1, windowStart: now });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }
  if (entry.count >= MAX_REQUESTS) return { success: false, remaining: 0 };
  entry.count += 1;
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}
