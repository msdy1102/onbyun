/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── X-Powered-By 헤더 제거 (Next.js 내장 옵션) ─────────
  poweredByHeader: false,

  // ─── 소스맵 외부 노출 금지 ───────────────────────────────
  productionBrowserSourceMaps: false,

  // ─── 보안 헤더 ───────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HTTPS 강제 (1년, 서브도메인 포함)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // 클릭재킹 방지
          { key: "X-Frame-Options", value: "DENY" },
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS 필터 (구형 브라우저)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer 정책
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 권한 정책 (불필요한 브라우저 기능 차단)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // 콘텐츠 보안 정책
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://js.tosspayments.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.anthropic.com https://*.supabase.co https://api.tosspayments.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
