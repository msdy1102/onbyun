import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export const metadata = {
  metadataBase: new URL("https://onbyun.vercel.app"),
  title: {
    default: "온변 — 온라인 변호사 | 계약서 주의사항 · 신청 서류 무료 안내",
    template: "%s | 온변",
  },
  description: "근로계약서, 임대차계약서, 프리랜서 계약서 주의사항과 청년월세지원·정책대출·실업급여 신청 서류를 무료로 확인하세요. 변호사 비용 없이 법률 정보를 쉽게 얻을 수 있습니다.",
  keywords: [
    "온변", "온라인변호사", "계약서 주의사항", "근로계약서 확인사항",
    "임대차계약서 주의사항", "전세사기 체크리스트", "프리랜서 계약서",
    "청년월세지원 서류", "버팀목전세대출 서류", "실업급여 신청방법",
    "청년도약계좌 서류", "내용증명 작성", "합의서 주의사항", "무료 법률 정보"
  ],
  authors: [{ name: "온변" }],
  creator: "온변",
  publisher: "온변",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://onbyun.vercel.app",
    siteName: "온변",
    title: "온변 — 온라인 변호사 | 계약서 주의사항 무료 안내",
    description: "근로계약서, 임대차계약서, 프리랜서 계약서 주의사항과 정부지원 신청 서류를 무료로 확인하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "온변 — 온라인 변호사",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "온변 — 온라인 변호사",
    description: "계약서 주의사항과 신청 서류를 무료로 확인하세요.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // 구글 Search Console 등록 후 여기에 코드 입력
    // google: "구글_인증코드",
    // naver 소유확인 코드
    // other: { "naver-site-verification": "네이버_인증코드" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="canonical" href="https://onbyun.vercel.app" />
      </head>
      <body className={noto.className}>{children}</body>
    </html>
  );
}
