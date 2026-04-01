"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import "../landing.css";

/* ──────────────────────────────────────────
   GNB
────────────────────────────────────────── */
function GNB() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const isNewUser = session?.user?.isNewUser;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm shadow-sm">
            온
          </div>
          <div>
            <span className="text-gray-900 font-bold text-lg leading-none">온변</span>
            <span className="hidden sm:block text-xs text-gray-400 leading-none">온라인 변호사</span>
          </div>
        </Link>

        {/* 데스크탑 nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "계약서 주의사항", href: "#contracts" },
            { label: "계산기", href: "/calc" },
            { label: "정부지원", href: "/support" },
            { label: "AI 분석", href: "/ai" },
            { label: "요금제", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-gray-600 hover:text-brand font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA 영역 */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-brand font-medium transition-colors"
              >
                <img
                  src={session?.user?.image || ""}
                  alt="프로필"
                  className="w-7 h-7 rounded-full border border-brand-border"
                  onError={e => { e.target.style.display="none"; }}
                />
                {session?.user?.nickname || session?.user?.name?.split(" ")[0] || "마이페이지"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:block text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                로그아웃
              </button>
              <Link
                href="/ai"
                className="btn-primary inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              >
                계약서 분석하기
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm text-gray-600 hover:text-brand font-medium transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/onboarding"
                className="btn-primary inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              >
                지금 무료로 확인하기
              </Link>
            </>
          )}
          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          {[
            { label: "계약서 주의사항", href: "#contracts" },
            { label: "계산기", href: "/calc" },
            { label: "정부지원", href: "/support" },
            { label: "AI 분석", href: "/ai" },
            { label: "요금제", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-gray-700 font-medium py-2 border-b border-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {isLoggedIn ? (
            <>
              <Link href="/mypage" className="text-sm text-gray-700 font-medium py-2 border-b border-gray-50" onClick={() => setMenuOpen(false)}>
                마이페이지
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="text-sm text-gray-500 text-left py-2"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-600 text-left py-2"
              onClick={() => setMenuOpen(false)}
            >
              로그인
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

/* ──────────────────────────────────────────
   S1. 히어로
────────────────────────────────────────── */
function HeroSection({ isLoggedIn, content: c = {} }) {
  return (
    <section className="hero-bg pt-28 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* 좌측 카피 */}
        <div className="flex-1 text-center lg:text-left animate-fade-up">
          {/* 뱃지 */}
          <div className="inline-flex items-center gap-2 bg-brand-light border border-brand-border text-brand text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-brand inline-block animate-pulse"></span>
            {c.hero_badge || "계약서 분석 · 121종 무료 제공 · 가입 30초"}
          </div>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            {c.hero_headline ? (
              <span dangerouslySetInnerHTML={{ __html: c.hero_headline.split("\n").join("<br />").replace("위험 조항", '<span class=\"text-gradient\">위험 조항</span>') }} />
            ) : (
              <>서명하기 전,<br /><span className="text-gradient">위험 조항</span>부터 확인하세요</>
            )}
          </h1>

          {/* 서브카피 */}
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
            {c.hero_subheadline ? (
              <span dangerouslySetInnerHTML={{ __html: c.hero_subheadline.split("\n").join("<br />").replace("30초 안에", '<strong style=\"color:#374151\">30초 안에</strong>') }} />
            ) : (
              <>근로계약서·전세계약서·프리랜서 계약서 —<br className="hidden sm:block" />
              어떤 계약서든 <strong className="text-gray-700">30초 안에</strong> 읽고, 위험한 조항 3가지를 짚어드립니다.</>
            )}
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-8">
            <Link
              href={isLoggedIn ? "/ai" : "/onboarding"}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold shadow-md"
            >
              {isLoggedIn ? (c.hero_cta_primary || "계약서 분석하기") : (c.hero_cta_primary || "내 계약서 확인하기")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/doc"
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold"
            >
              {c.hero_cta_secondary || "121종 목록 보기"}
            </Link>
          </div>

          {/* 마이크로 신뢰 지표 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center lg:justify-start text-xs text-gray-400">
            {[
              "신용카드 없이 시작",
              "체크리스트 121종 영구 무료",
              "AI 분석 하루 1회 무료",
              "가입 30초",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 우측 제품 미리보기 */}
        <div className="hero-mock flex-1 w-full max-w-md lg:max-w-none animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="glass-card rounded-2xl p-5 pulse-brand">
            {/* 파일 헤더 */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                <span className="text-lg">📄</span>
                프리랜서 용역 계약서.pdf
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-danger text-xs font-bold px-2 py-1 rounded-full">위험 2건</span>
                <span className="badge-safe text-xs font-bold px-2 py-1 rounded-full">안전 14건</span>
              </div>
            </div>

            {/* 분석 결과 아이템 */}
            <div className="space-y-3">
              {/* 위험 */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="text-red-700 text-xs font-bold">저작권 귀속 조항</span>
                </div>
                <p className="text-red-600 text-xs leading-relaxed pl-6">
                  창작물의 2차적 저작권 작성권까지 포괄적으로 양도하도록 되어 있어 프리랜서에게 매우 불리합니다.
                </p>
              </div>

              {/* 주의 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <span className="text-amber-700 text-xs font-bold">대금 지급 지연</span>
                </div>
                <p className="text-amber-600 text-xs leading-relaxed pl-6">
                  지연 이자에 대한 명시가 누락되어 있습니다.
                </p>
              </div>

              {/* 안전 */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="text-green-700 text-xs font-bold">계약 기간 — 1년, 자동 갱신 없음</span>
                </div>
                <p className="text-green-600 text-xs pl-6">만료 후 별도 서면 합의 없이 연장되지 않습니다.</p>
              </div>
            </div>

            {/* AI 한줄 평가 */}
            <div className="mt-4 pt-4 border-t border-brand-border bg-brand-light rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-brand">✦</span>
                <span className="text-brand text-xs font-bold">AI 한 줄 평가</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                2개 조항 수정 협의 없이 서명하면 작업물 저작권 전체를 잃습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S2. 계약서 유형 빠른 진입
────────────────────────────────────────── */
const CONTRACT_TYPES = [
  {
    icon: "📋",
    title: "근로계약서",
    desc: "수습 3개월간 급여를 20% 깎는 조항, 퇴직 후 2년간 경쟁사 입사를 막는 조항 — 서명 전 이 2가지만 확인해도 달라집니다.",
    tags: ["#포괄임금", "#수습 급여 삭감", "#경업금지"],
    href: "/doc/labor",
  },
  {
    icon: "🏠",
    title: "전세·임대차 계약서",
    desc: "근저당이 보증금보다 높으면 경매 시 한 푼도 못 받을 수 있습니다. 계약 전 등기부등본 1장으로 확인할 수 있는 것들을 알려드립니다.",
    tags: ["#근저당 초과", "#특약 조항", "#보증금 반환"],
    href: "/doc/lease",
  },
  {
    icon: "💻",
    title: "프리랜서 계약서",
    desc: "'작업물 저작권 전부 발주사 귀속' 조항은 국내 외주 계약의 70%에 들어있습니다. 서명 전 삭제 또는 수정 요청 가능한 조항을 알려드립니다.",
    tags: ["#IP 귀속", "#대금 지급 지연", "#무한 수정 요구"],
    href: "/doc/freelance",
  },
  {
    icon: "☕",
    title: "알바 계약서",
    desc: "주 15시간 이상 일하면 주휴수당이 법으로 보장됩니다. 안 줘도 된다고 써있는 계약서는 그 조항 자체가 무효입니다.",
    tags: ["#주휴수당", "#최저임금", "#즉시 해고 통보"],
    href: "/doc/labor-15up-5up",
  },
  {
    icon: "🏢",
    title: "상가 임대차 계약서",
    desc: "최초 계약일로부터 10년간 계약갱신을 요구할 권리가 있습니다. 임대인이 거절할 수 있는 조건 6가지를 미리 파악하세요.",
    tags: ["#계약갱신 거절 조건", "#권리금 회수", "#임대료 5% 상한"],
    href: "/doc/commercial-lease",
  },
  {
    icon: "📁",
    title: "121종 전체 목록",
    desc: "내용증명 35종 · 합의서 9종 · 투자·주식 10종 · 지식재산권 7종 외. 찾는 계약서가 없으면 직접 요청할 수 있습니다.",
    tags: ["#121종", "#카테고리 전체"],
    href: "/doc",
    isMore: true,
  },
];

function ContractsSection({ content: c = {} }) {
  return (
    <section id="contracts" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <span className="inline-block text-brand text-sm font-semibold tracking-wider uppercase mb-3">
            {c.contracts_badge || "지금 어떤 계약서를 받으셨나요?"}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            {c.contracts_title || "받은 계약서를 클릭하면 바로 확인할 수 있어요"}
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            {(c.contracts_sub || "취업·알바·전세·프리랜서 계약서마다 놓치기 쉬운 조항이 다릅니다.\n유형별로 위험 조항 상위 5개를 먼저 보여드립니다.").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONTRACT_TYPES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`contract-card rounded-2xl p-6 border ${
                item.isMore
                  ? "border-dashed border-brand-border bg-brand-light hover:bg-blue-50"
                  : "border-gray-200 bg-white hover:border-brand"
              }`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className={`font-bold text-base mb-2 ${item.isMore ? "text-brand" : "text-gray-900"}`}>
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S3. 문제 공감 인용
────────────────────────────────────────── */
const REVIEWS_PROBLEM = [
  {
    quote: "입사 6개월 만에 야근이 주 4회로 늘었는데, 계약서에 '포괄임금제'가 적혀 있어서 추가 수당을 하나도 못 받았어요. 서명 전에 그 조항이 뭔지 알았더라면...",
    name: "김○○",
    role: "직장인 1년차 · 서울",
    result: "월 40시간 초과근무 수당 0원",
    icon: "💼",
  },
  {
    quote: "3줄짜리 특약이 문제였어요. '임차인 귀책 사유 시 보증금에서 수리비 우선 공제' — 이 한 문장 때문에 보증금 1,800만 원 중 340만 원을 못 돌려받았습니다.",
    name: "이○○",
    role: "직장인 29세 · 인천",
    result: "보증금 340만 원 미반환",
    icon: "🏠",
  },
  {
    quote: "3개월 작업한 브랜드 디자인인데, 계약서 제15조 한 줄로 포트폴리오에도 올릴 수 없게 됐어요. 클라이언트가 '업계 표준'이라고 해서 그냥 믿었는데.",
    name: "박○○",
    role: "프리랜서 디자이너 3년차",
    result: "3개월 작업물 저작권 전부 상실",
    icon: "💻",
  },
];

function ProblemSection({ content: c = {} }) {
  const reviews = [
    {
      icon: "💼",
      quote:  c.problem_review1_quote  || REVIEWS_PROBLEM[0].quote,
      name:   c.problem_review1_name   || REVIEWS_PROBLEM[0].name,
      role:   c.problem_review1_role   || REVIEWS_PROBLEM[0].role,
      result: c.problem_review1_result || REVIEWS_PROBLEM[0].result,
    },
    {
      icon: "🏠",
      quote:  c.problem_review2_quote  || REVIEWS_PROBLEM[1].quote,
      name:   c.problem_review2_name   || REVIEWS_PROBLEM[1].name,
      role:   c.problem_review2_role   || REVIEWS_PROBLEM[1].role,
      result: c.problem_review2_result || REVIEWS_PROBLEM[1].result,
    },
    {
      icon: "💻",
      quote:  c.problem_review3_quote  || REVIEWS_PROBLEM[2].quote,
      name:   c.problem_review3_name   || REVIEWS_PROBLEM[2].name,
      role:   c.problem_review3_role   || REVIEWS_PROBLEM[2].role,
      result: c.problem_review3_result || REVIEWS_PROBLEM[2].result,
    },
  ];
  return (
    <section className="py-20 px-4 sm:px-6 section-alt">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-brand text-sm font-semibold tracking-wider uppercase mb-3">
            많은 분들이 이렇게 후회합니다
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
            {c.problem_title || "서명하고 나서 알게 되는 것들"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {reviews.map((r) => (
            <div key={r.name} className="review-card glass-card rounded-2xl p-6">
              <div className="text-3xl mb-4">{r.icon}</div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-5 italic">
                "{r.quote}"
              </blockquote>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-900 font-bold text-sm">{r.name}</p>
                <p className="text-gray-400 text-xs mb-2">{r.role}</p>
                <span className="badge-danger text-xs px-2.5 py-1 rounded-full font-semibold">
                  {r.result}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 요약 강조 블록 */}
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm">
          <p className="text-gray-500 text-base leading-relaxed mb-3">
            계약서 검토를 변호사에게 맡기면 최소 <strong className="text-gray-900">10만 원, 2~3일</strong>.<br />
            대부분은 그냥 서명합니다.
          </p>
          <p className="text-brand font-extrabold text-xl">
            온변은 18초 만에, 0원으로 같은 일을 합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S4. How It Works
────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "계약서 유형 선택",
    desc: "근로계약서·전세·프리랜서·알바 중 해당하는 걸 누르면 됩니다. 텍스트로 검색하면 121종 중에서 바로 찾아드립니다.",
    time: "선택까지 10초",
    icon: (
      <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "PDF 또는 사진 업로드",
    desc: "계약서 PDF를 올리거나, 스마트폰으로 찍은 사진을 올려도 됩니다. AI가 텍스트를 인식하고 위험 조항 위치를 찾아냅니다.",
    time: "분석까지 평균 18초",
    icon: (
      <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "위험 조항 확인 & 대응",
    desc: "'이 조항은 왜 위험한지', '어떻게 수정 요청하면 되는지'를 쉬운 말로 설명해드립니다.",
    time: "서명 전 10분이면 충분",
    icon: (
      <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function HowItWorksSection({ content: c = {} }) {
  return (
    <section id="ai" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-brand text-sm font-semibold tracking-wider uppercase mb-3">
            사용 방법
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            {c.hiw_title || "파일 올리고 30초, 끝입니다"}
          </h2>
          <p className="text-gray-500 text-base">
            {c.hiw_sub || "앱 설치 없이, 회원가입 없이도 바로 확인됩니다. 이메일 가입은 30초면 충분합니다."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              {/* 아이콘 */}
              <div className="w-16 h-16 rounded-2xl bg-brand-light border border-brand-border flex items-center justify-center mb-4">
                {step.icon}
              </div>
              {/* 번호 */}
              <div className="text-brand font-black text-4xl mb-2">{step.num}</div>
              {/* 제목 */}
              <h3 className="font-bold text-gray-900 text-base mb-3">{step.title}</h3>
              {/* 설명 */}
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.desc}</p>
              {/* 시간 뱃지 */}
              <span className="inline-block bg-brand-light text-brand text-xs font-semibold px-3 py-1.5 rounded-full">
                → {step.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S5. 사회적 증명 (숫자 + 리뷰)
────────────────────────────────────────── */
const STATS = [
  { value: "121+", label: "무료로 확인할 수 있는 계약서 유형", suffix: "" },
  { value: "18s",  label: "PDF 업로드부터 결과까지", suffix: "" },
  { value: "0원",  label: "체크리스트 121종 + 하루 1회 AI 분석", suffix: "" },
  { value: "15+",  label: "청년·직장인 정부지원 서류 안내", suffix: "" },
];

const USER_REVIEWS = [
  {
    stars: 5,
    quote: "입사 전날 밤에 근로계약서를 올렸는데 포괄임금제 조항을 잡아줬어요. 다음날 HR 담당자한테 연락해서 해당 조항을 삭제하고 서명했습니다.",
    name: "김○○",
    role: "신입사원 26세",
    result: "포괄임금제 조항 1개 삭제 후 입사",
  },
  {
    stars: 5,
    quote: "계약 전날 밤 11시에 전세계약서 PDF를 올렸어요. 3번째 특약 조항이 집주인한테만 유리하다고 정확히 짚어줘서 다음날 계약 자리에서 그 문장 빼달라고 요청했고 통했습니다.",
    name: "이○○",
    role: "직장인 31세",
    result: "특약 조항 1개 삭제 후 계약 체결",
  },
  {
    stars: 5,
    quote: "프리랜서 3년차인데 계약서를 제대로 읽은 게 사실 이번이 처음이에요. IP 귀속 조항이 위험하다고 뜨길래 '작업물 원본 파일은 저작권 귀속에서 제외' 한 문장을 추가 협의해서 넣었습니다.",
    name: "박○○",
    role: "프리랜서 개발자",
    result: "IP 귀속 예외 조항 1건 협의 추가",
  },
];

function SocialProofSection({ content: c = {} }) {
  return (
    <section className="py-20 px-4 sm:px-6 section-alt">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
            계약서 서명 전날 밤, 가장 많이 찾습니다
          </h2>
        </div>

        {/* 숫자 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-6 text-center">
              <div className="stat-number mb-2">{s.value}</div>
              <p className="text-gray-500 text-xs leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 리뷰 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { stars:5, quote: c.proof_review1_quote||USER_REVIEWS[0].quote, name: c.proof_review1_name||USER_REVIEWS[0].name, role: c.proof_review1_role||USER_REVIEWS[0].role, result: c.proof_review1_result||USER_REVIEWS[0].result },
            { stars:5, quote: c.proof_review2_quote||USER_REVIEWS[1].quote, name: c.proof_review2_name||USER_REVIEWS[1].name, role: c.proof_review2_role||USER_REVIEWS[1].role, result: c.proof_review2_result||USER_REVIEWS[1].result },
            { stars:5, quote: c.proof_review3_quote||USER_REVIEWS[2].quote, name: c.proof_review3_name||USER_REVIEWS[2].name, role: c.proof_review3_role||USER_REVIEWS[2].role, result: c.proof_review3_result||USER_REVIEWS[2].result },
          ].map((r) => (
            <div key={r.name} className="review-card bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(r.stars)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                "{r.quote}"
              </blockquote>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-900 font-bold text-sm">{r.name}</p>
                <p className="text-gray-400 text-xs mb-2">{r.role}</p>
                <span className="badge-safe text-xs px-2.5 py-1 rounded-full font-semibold">
                  ✓ {r.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S6. 핵심 기능 상세
────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
            법률 전문가 수준의 분석 엔진
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 기능 1 — 체크리스트 */}
          <div className="border border-gray-200 rounded-2xl p-8 hover:border-brand-border transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full">FREE / 기본 제공</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mt-4 mb-3">
              계약서 유형별 위험 조항 상위 5개,<br />한 페이지에 정리했습니다
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              근로계약서에서 90%가 놓치는 조항, 전세계약서에서 분쟁으로 이어지는 조항 3가지, 프리랜서 계약에서 저작권을 잃게 만드는 문장 패턴 — 유형별로 먼저 알아야 할 것을 순서대로 보여드립니다.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "8개 카테고리 · 121종 계약서 유형 무료 제공",
                "위험 / 주의 / 확인 3등급으로 우선순위 표시",
                "조항 원문 옆에 쉬운 말 해설 병기",
                '"이렇게 수정 요청하세요" 실전 문구 제공',
                "관련 법령 조문 및 민원 신청 링크 포함",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
                  <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            {/* 체크리스트 UI 미리보기 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
              <p className="font-bold text-gray-700 mb-3">근로계약서 주의사항</p>
              {[
                { level: "위험", color: "badge-danger", text: "포괄임금제 명시 여부 — 연장·야간·휴일 수당이 기본급에 포함되어 추가 수당을 못 받을 수 있습니다." },
                { level: "위험", color: "badge-danger", text: "수습 기간 중 급여 80% 조항 — 3개월 수습 기간 동안 최저임금의 80%만 지급 가능합니다." },
                { level: "주의", color: "badge-warn", text: "경업금지·비밀유지 조항 — 퇴직 후 경쟁사 취업 금지 범위와 기간을 확인하세요." },
                { level: "확인", color: "text-blue-600 bg-blue-50 border border-blue-200", text: "연차 발생 기준 — 입사 1년 미만도 매월 1일 이상 개근 시 연차 1일 발생합니다." },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className={`${item.color} text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0`}>{item.level}</span>
                  <span className="text-gray-600 leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 기능 2 — AI 분석 */}
          <div className="border-2 border-brand rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-brand text-white font-semibold px-3 py-1 rounded-full">AI CORE / 핵심 기능</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-4 mb-1">
                스탠다드 · 월 9,900원부터
              </h3>
              <p className="text-brand font-bold text-base mb-3">
                내 계약서 PDF를 올리면<br />18초 안에 위험 조항을 뽑아드립니다
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                PDF·이미지·텍스트 붙여넣기 모두 됩니다. AI가 계약서 유형을 스스로 판별하고, 해당 유형에서 자주 문제가 되는 조항 패턴과 내 계약서를 비교해 위험 항목을 추출합니다.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "PDF · 이미지(JPG/PNG) · 텍스트 직접 입력 모두 지원",
                  "계약서 유형 자동 판별 (근로 / 임대차 / 프리랜서 / 이용약관 등)",
                  "위험 조항 5~10개 자동 추출 + 조항별 위험 이유 설명",
                  '"이 문장을 이렇게 수정 요청하세요" 실전 협의 가이드 포함',
                  "분석 결과 30일 저장 · PDF 내보내기",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
                    <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* AI 분석 결과 UI 미리보기 — 실제 결과 스타일 */}
              <div className="rounded-xl overflow-hidden border border-gray-200">
                {/* 결과 헤더 */}
                <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">분석 완료 · 17초</div>
                    <div className="text-sm font-bold text-gray-900">프리랜서 용역계약서</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">위험 3건</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">양호 2건</span>
                  </div>
                </div>
                {/* AI 한줄 평가 */}
                <div className="bg-brand px-4 py-2.5 flex items-start gap-2">
                  <span className="text-white text-xs mt-0.5">✦</span>
                  <p className="text-white text-xs leading-relaxed font-medium">
                    저작권 전면귀속·무제한수정·지연이자 미명시 — 3개 조항 수정 협의 없이 서명하면 작업물과 수익 모두 잃을 수 있습니다.
                  </p>
                </div>
                {/* 결과 항목 */}
                <div className="bg-white divide-y divide-gray-50">
                  {/* 위험 1 */}
                  <div className="px-4 py-3 bg-red-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      <span className="text-red-600 text-xs font-bold">위험</span>
                      <span className="text-gray-900 text-xs font-semibold">저작권 전면 귀속 (제15조)</span>
                    </div>
                    <p className="text-red-700 text-xs leading-relaxed pl-3.5">
                      결과물 저작권이 계약 완료 즉시 갑에게 귀속됩니다. 포트폴리오 사용도 불가 — 을에게 매우 불리합니다.
                    </p>
                    <div className="mt-1.5 pl-3.5 text-xs text-red-500 font-medium">
                      💡 "포트폴리오 목적 사용권을 을에게 유보한다" 문구 추가 요청하세요.
                    </div>
                  </div>
                  {/* 위험 2 */}
                  <div className="px-4 py-3 bg-amber-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                      <span className="text-amber-700 text-xs font-bold">위험</span>
                      <span className="text-gray-900 text-xs font-semibold">무제한 수정 요구 (제16조)</span>
                    </div>
                    <p className="text-amber-700 text-xs leading-relaxed pl-3.5">
                      납품 후 30일 이내 수정 횟수 무제한 — 검수 기준 없이 을이 무한 수정에 묶일 수 있습니다.
                    </p>
                    <div className="mt-1.5 pl-3.5 text-xs text-amber-600 font-medium">
                      💡 "수정은 2회 이내, 범위는 최초 요구사항 기준" 으로 명시 요청하세요.
                    </div>
                  </div>
                  {/* 위험 3 */}
                  <div className="px-4 py-3 bg-amber-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                      <span className="text-amber-700 text-xs font-bold">주의</span>
                      <span className="text-gray-900 text-xs font-semibold">대금 지급 지연이자 미명시 (제17조)</span>
                    </div>
                    <p className="text-amber-700 text-xs leading-relaxed pl-3.5">
                      지급 기한 60일 + 지연이자 없음 — 갑의 내부 검수가 길어지면 대금 지연 시 보상 수단이 없습니다.
                    </p>
                  </div>
                  {/* 양호 */}
                  <div className="px-4 py-3 bg-green-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                      <span className="text-green-700 text-xs font-bold">양호</span>
                      <span className="text-gray-900 text-xs font-semibold">계약 기간 및 납품 일정 명확</span>
                    </div>
                    <p className="text-green-700 text-xs leading-relaxed pl-3.5">
                      계약 기간, 납품 일정, 업무 범위가 명확하게 명시되어 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S7. 가격 플랜
────────────────────────────────────────── */
const PLANS = [
  {
    name: "무료",
    price: "0원",
    sub: "가입 없이도 체크리스트 121종 확인 가능",
    features: [
      { text: "121종 체크리스트", ok: true },
      { text: "정부지원 서류 안내", ok: true },
      { text: "AI 분석 (하루 1회)", ok: true },
      { text: "분석 내역 저장", ok: false },
      { text: "PDF 업로드 분석", ok: false },
      { text: "팀 공유", ok: false },
    ],
    cta: "무료로 시작하기",
    ctaHref: "/onboarding",
    featured: false,
    disabled: false,
  },
  {
    name: "스탠다드",
    price: "9,900원",
    priceNote: "/월",
    annualNote: "연간 결제 시 월 7,900원 · 하루 1잔 커피값",
    sub: "계약서를 월 3건 이상 검토하는 분",
    features: [
      { text: "121종 체크리스트", ok: true },
      { text: "정부지원 서류 안내", ok: true },
      { text: "AI 분석 무제한", ok: true },
      { text: "분석 내역 30일 저장", ok: true },
      { text: "PDF 업로드 분석", ok: true },
      { text: "팀 공유", ok: false },
    ],
    cta: "14일 무료 체험",
    ctaHref: "/onboarding",
    featured: true,
    disabled: true,
  },
  {
    name: "프로",
    price: "29,900원",
    priceNote: "/월",
    annualNote: "팀 5명이 함께 쓰면 1인당 월 4,980원",
    sub: "계약 업무가 많은 중소기업 및 스타트업",
    features: [
      { text: "스탠다드 모든 기능 포함", ok: true },
      { text: "팀 초대 최대 5명", ok: true },
      { text: "문서 클라우드 무제한 보관", ok: true },
      { text: "기업용 맞춤 계약서 템플릿", ok: true },
      { text: "API 제공", ok: true },
      { text: "전담 우선 지원", ok: true },
    ],
    cta: "프로 시작하기",
    ctaHref: "/onboarding",
    featured: false,
    disabled: true,
  },
];

function PricingSection({ content: c = {} }) {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 section-alt">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-brand text-sm font-semibold tracking-wider uppercase mb-3">요금제</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            {c.pricing_title || "체크리스트는 무료, AI 분석은 월 9,900원"}
          </h2>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            {c.pricing_sub ? (
              c.pricing_sub.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)
            ) : (
              <>계약서 체크리스트 121종은 가입 없이 영구 무료입니다.<br />
              AI 분석이 하루 1회 이상 필요하다면 스탠다드를 추천합니다.</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 bg-white relative ${
                plan.featured
                  ? "plan-featured shadow-lg"
                  : "border border-gray-200"
              }`}
            >
              {plan.featured && <div className="plan-badge">가장 많이 선택</div>}
              <div className="mb-6">
                <p className="text-gray-500 text-sm font-medium mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.priceNote && <span className="text-gray-400 text-sm mb-1">{plan.priceNote}</span>}
                </div>
                {plan.annualNote && (
                  <p className="text-brand text-xs font-semibold">{plan.annualNote}</p>
                )}
                <p className="text-gray-400 text-xs mt-2">{plan.sub}</p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.ok ? (
                      <svg className="w-4 h-4 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    )}
                    <span className={f.ok ? "text-gray-700" : "text-gray-300 line-through"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {plan.disabled ? (
                <div className="block text-center py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 select-none">
                  준비 중
                </div>
              ) : (
                <Link
                  href={plan.ctaHref}
                  className={`block text-center py-3 rounded-full font-bold text-sm transition-all ${
                    plan.featured
                      ? "btn-primary shadow-md"
                      : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-gray-400 text-sm">
          14일 무료 체험 — 카드 등록만 하고 14일 동안 스탠다드 전체 기능을 씁니다.<br />
          마음에 안 들면 앱 내에서 클릭 1번으로 해지. <strong className="text-gray-600">전화 연결 없습니다.</strong>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S8. FAQ
────────────────────────────────────────── */
const FAQS = [
  {
    q: "온변 분석 결과로 소송에서 이길 수 있나요?",
    a: "온변의 분석 결과는 법적 효력이 없으며, 소송 자료로 사용할 수 없습니다. 온변은 '서명 전에 이 조항이 이상한지 아닌지' 1차로 파악하는 용도입니다. 계약 분쟁이 이미 발생했다면 변호사 상담을 받으셔야 합니다. 온변 분석 결과를 출력해 상담 자료로 활용하는 분들은 계십니다.",
  },
  {
    q: "계약서에 개인정보가 있는데 올려도 괜찮나요?",
    a: "업로드된 파일은 AI 분석이 끝나는 즉시 서버에서 삭제됩니다. 분석 결과 텍스트만 저장되고, 원본 파일은 어디에도 남지 않습니다. 이름·주민번호·계좌번호가 포함된 계약서도 분석 후 파일 자체는 보관하지 않습니다.",
  },
  {
    q: "제가 받은 계약서도 분석이 되나요?",
    a: "근로계약서 16종 · 프리랜서·용역 15종 · 부동산·임대차 6종 · 투자·주식 10종 · 내용증명 35종 등 총 121종을 다룹니다. AI 분석은 업로드된 계약서 유형을 자동으로 판별하므로 종류를 몰라도 됩니다. 목록에 없는 계약서라도 AI 분석에서 자유 텍스트로 입력하면 분석됩니다.",
  },
  {
    q: "청년 월세 지원을 신청하려는데, 서류를 어디서 확인하나요?",
    a: "온변 '정부지원 서류' 탭에서 프로그램명을 검색하면 신청 자격 조건 · 필요 서류 목록 · 제출처를 한 페이지에서 확인할 수 있습니다. 복지로·고용24·청년포털을 각각 찾아다닐 필요 없이, 온변에서 바로 출력하거나 링크로 이동할 수 있습니다.",
  },
  {
    q: "무료로도 충분한지, 유료로 업그레이드해야 하는지 모르겠어요.",
    a: "계약서 서명 전 1~2번 확인하는 용도라면 무료 플랜(하루 1회 AI 분석)으로 충분합니다. 계약서를 월 3건 이상 검토하거나, PDF를 올려서 분석받고 싶다면 스탠다드(월 9,900원)가 맞습니다. 14일 무료 체험 기간에 직접 써보고 결정하셔도 됩니다.",
  },
  {
    q: "AI가 중요한 조항을 빠뜨릴 수도 있지 않나요?",
    a: "계약서 유형별로 자주 문제가 되는 조항 패턴을 기반으로 분석하기 때문에 일반 ChatGPT에 그냥 붙여넣는 것보다 정확합니다. 다만 계약서의 모든 법적 리스크를 100% 잡아낸다고 보장하지 않습니다. 보증금 1억 원 이상이거나 사업 관련 중요 계약은 온변 결과를 1차 참고로 쓰고, 변호사 검토를 병행하시길 권합니다.",
  },
];

function FAQSection({ content: c = {} }) {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
            {c.faq_title || "혹시 이런 게 걱정되시나요?"}
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="faq-item border border-gray-200 rounded-2xl overflow-hidden hover:border-brand-border transition-colors"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIdx === i ? "rotate-45" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S8-2. 불편사항 접수
────────────────────────────────────────── */
function FeedbackSection() {
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category || "기타", text: text.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setSent(true);
        setText("");
        setCategory("");
      } else {
        setError(json.message ?? "전송에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      setError("서버 오류가 발생했습니다. 다시 시도해주세요.");
    }
    setLoading(false);
  };

  return (
    <section className="py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-block text-brand text-sm font-semibold tracking-wider uppercase mb-3">
            불편사항 접수
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            불편하셨나요?
          </h2>
          <p className="text-gray-500 text-base">
            서비스 개선에 직접 반영됩니다. 편하게 적어주세요.
          </p>
        </div>

        {sent ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-light border border-brand-border flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">소중한 의견 감사해요!</h3>
            <p className="text-gray-500 text-sm mb-6">접수된 내용을 확인하고 빠르게 반영할게요.</p>
            <button
              onClick={() => setSent(false)}
              className="btn-secondary px-6 py-2 rounded-full text-sm font-semibold"
            >
              다른 의견 보내기
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8">
            {/* 카테고리 선택 */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["정보 오류", "기능 오작동", "UI/UX 불편", "콘텐츠 요청", "기타"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(prev => prev === cat ? "" : cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    category === cat
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-gray-500 border-gray-200 hover:border-brand hover:text-brand"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 텍스트 입력 */}
            <textarea
              value={text}
              onChange={e => { if (e.target.value.length <= 500) setText(e.target.value); }}
              placeholder={"불편하셨던 점이나 개선됐으면 하는 내용을 자유롭게 적어주세요.\n예) '근로계약서 주의사항에 00 내용이 빠진 것 같아요'"}
              rows={5}
              className="w-full px-4 py-3 border border-brand-border rounded-xl text-sm text-gray-800 resize-none outline-none bg-surface leading-relaxed transition-all focus:border-brand focus:shadow-sm mb-3"
              style={{ boxSizing: "border-box" }}
            />

            {/* 하단 행 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length} / 500자</span>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || loading}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  !text.trim() || loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {loading ? "전송 중..." : "전송하기"}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500">{error}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   S9. 최하단 CTA
────────────────────────────────────────── */
function FinalCTA({ isLoggedIn, content: c = {} }) {
  return (
    <section className="cta-bg py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
          지금 바로 확인하세요
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
          {c.cta_headline ? (
            c.cta_headline.split("\n").map((l, i) => <span key={i} style={{ display:"block" }}>{l}</span>)
          ) : (
            <>계약서 앞에서<br />
            더 이상 <em className="not-italic underline decoration-white/40 decoration-2 underline-offset-4">을(乙)</em>이 되지 않도록</>
          )}
        </h2>
        <p className="text-white/80 text-base mb-10">
          {c.cta_sub ? (
            c.cta_sub.split("\n").map((l, i) => <span key={i} style={{ display:"block" }}>{l}</span>)
          ) : (
            <>지금 올리면 18초 후에 결과가 나옵니다.<br />카드 등록 없이, 첫 분석은 무료입니다.</>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href={isLoggedIn ? "/ai" : "/onboarding"}
            className="inline-flex items-center justify-center gap-2 bg-white text-brand font-extrabold px-10 py-4 rounded-full text-base hover:bg-gray-50 transition-all shadow-lg hover:-translate-y-0.5"
          >
            {isLoggedIn ? "계약서 분석하기" : "내 계약서 분석하기"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/doc"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full text-base font-bold text-white border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all"
          >
            121종 목록 먼저 보기
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center text-white/70 text-xs">
          {["첫 분석 무료", "가입 30초", "카드 없이 시작", "해지 클릭 1번"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   푸터
────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          {/* 브랜드 */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-xs">온</div>
              <span className="text-white font-bold">온변</span>
              <span className="text-gray-500 text-sm">온라인 변호사</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              온변이 제공하는 모든 정보와 AI 분석 결과는 법적 효력이 없으며 참고 목적으로만 사용하세요.
              보증금 1억 원 이상 계약, 사업 관련 계약, 분쟁이 발생한 경우에는 변호사 상담을 받으시길 권합니다.
            </p>
          </div>

          {/* 링크 */}
          <div className="flex flex-wrap gap-6 text-sm">
            {[
              { label: "이용약관", href: "/terms" },
              { label: "개인정보처리방침", href: "/privacy" },
              { label: "서비스약관", href: "/service-terms" },
              { label: "운영 정책", href: "/policy" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-xs text-gray-600">
          © 2025 온변(Onbyun). All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────
   메인 Landing 컴포넌트
────────────────────────────────────────── */
export default function Landing() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => setSiteContent(data))
      .catch(() => {}); // 실패 시 하드코딩 기본값 유지
  }, []);

  const c = siteContent || {}; // 로드 전엔 빈 객체 — 각 섹션이 기본값 fallback 처리

  return (
    <div className="landing-root">
      <GNB />
      <main>
        <HeroSection isLoggedIn={isLoggedIn} content={c} />
        <ContractsSection content={c} />
        <ProblemSection content={c} />
        <HowItWorksSection content={c} />
        <SocialProofSection content={c} />
        <FeaturesSection />
        <PricingSection content={c} />
        <FAQSection content={c} />
        <FeedbackSection />
        <FinalCTA isLoggedIn={isLoggedIn} content={c} />
      </main>
      <Footer />
    </div>
  );
}
