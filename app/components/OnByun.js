"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { CONTRACTS, APPLICATIONS, CONTRACT_CATEGORIES, CONTRACT_LIST } from "../data";
import { DOC_DETAILS } from "../doc-details";
import styles from "./OnByun.module.css";

const LEVEL_CONFIG = {
  danger: { label: "위험", bg: "#fff1f1", border: "#ffcccc", text: "#c00000", dot: "#e03535" },
  warn:   { label: "주의", bg: "#fffbee", border: "#ffe5a0", text: "#7a5000", dot: "#d08600" },
  info:   { label: "확인", bg: "#eef2fd", border: "#c5d4f5", text: "#2d5bbf", dot: "#5385E4" },
};

const TAG_COLORS = {
  blue:   { bg: "#eef2fd", text: "#2d5bbf", border: "#c5d4f5" },
  green:  { bg: "#f5f5f5", text: "#555555", border: "#C3C3C3" },
  purple: { bg: "#f5f5f5", text: "#555555", border: "#C3C3C3" },
  orange: { bg: "#f5f5f5", text: "#555555", border: "#C3C3C3" },
  red:    { bg: "#fff1f1", text: "#c00000", border: "#ffcccc" },
};

const RISK_LEVELS = {
  safe:    { label: "안전", color: "#2a9d5c", bg: "#f5f5f5", bar: "#2a9d5c", width: "25%" },
  caution: { label: "주의", color: "#d08600", bg: "#fffbee", bar: "#d08600", width: "60%" },
  danger:  { label: "위험", color: "#e03535", bg: "#fff1f1", bar: "#e03535", width: "90%" },
};

// 주로 사용하는 문서 8개 (검색량 기준)
const POPULAR_DOCS = [
  { id: "labor", label: "근로계약서", icon: "💼", type: "contract", desc: "알바·직장 계약" },
  { id: "lease", label: "임대차 계약서", icon: "🏠", type: "contract", desc: "전세·월세" },
  { id: "unemployment", label: "실업급여 신청", icon: "📑", type: "application", desc: "퇴직 후 지원" },
  { id: "freelance", label: "프리랜서 계약서", icon: "💻", type: "contract", desc: "외주·용역" },
  { id: "youth-rent", label: "청년 월세 지원", icon: "🏘️", type: "application", desc: "월 최대 20만 원" },
  { id: "cert-deposit-return", label: "내용증명(보증금 반환)", icon: "📬", type: "list", desc: "보증금 못 받을 때" },
  { id: "policy-loan", label: "청년 정책대출", icon: "💰", type: "application", desc: "버팀목·햇살론" },
  { id: "employment", label: "취업·위촉 계약서", icon: "📋", type: "contract", desc: "정규직·위촉직" },
];

// 전체 검색 대상 통합 인덱스
function buildSearchIndex() {
  const idx = [];
  CONTRACTS.forEach(c => idx.push({ id: c.id, label: c.label, summary: c.summary, type: "contract", icon: c.icon, tag: c.tag, tagColor: c.tagColor }));
  APPLICATIONS.forEach(a => idx.push({ id: a.id, label: a.label, summary: a.summary, type: "application", icon: a.icon, tag: a.tag, tagColor: a.tagColor }));
  CONTRACT_LIST.forEach(l => {
    const cat = CONTRACT_CATEGORIES.find(c => c.id === l.category);
    idx.push({ id: l.id, label: l.label, summary: cat?.label || "", type: "list", icon: "📄", tag: cat?.label || "", tagColor: "blue" });
  });
  return idx;
}

const SEARCH_INDEX = buildSearchIndex();

export default function OnByun() {
  const [tab, setTab] = useState("home"); // home | list | ai
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [docOpenId, setDocOpenId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginTab, setLoginTab] = useState("login"); // login | signup
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiContractType, setAiContractType] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const searchRef = useRef(null);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(i =>
      i.label.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [search]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleTabChange = (t) => {
    setTab(t);
    setSelectedItem(null);
    setDocOpenId(null);
    setSearch("");
    setActiveCategory("all");
    setAiResult(null);
    setAiError("");
  };

  const handleSelectResult = (item) => {
    setSearch(item.label);
    setShowResults(false);
    openItem(item.id, item.type);
  };

  const handlePopularClick = (doc) => {
    openItem(doc.id, doc.type);
  };

  function openItem(id, type) {
    if (type === "contract") {
      const data = CONTRACTS.find(c => c.id === id);
      if (data) setSelectedItem({ data, type: "contract" });
    } else if (type === "application") {
      const data = APPLICATIONS.find(a => a.id === id);
      if (data) setSelectedItem({ data, type: "application" });
    } else if (type === "list") {
      const data = CONTRACT_LIST.find(l => l.id === id);
      if (data) {
        setTab("list");
        setDocOpenId(id);
        const cat = data.category;
        setActiveCategory(cat);
      }
    }
  }

  const renderChecklist = (checklist) => checklist.map((c, i) => {
    const lc = LEVEL_CONFIG[c.level] || LEVEL_CONFIG.info;
    return (
      <div key={i} className={styles.checkItem} style={{ background: lc.bg, borderColor: lc.border }}>
        <div className={styles.checkHeader}>
          <span className={styles.checkDot} style={{ background: lc.dot }} />
          <span className={styles.checkLevel} style={{ color: lc.text }}>{lc.label}</span>
          <span className={styles.checkTitle}>{c.title}</span>
        </div>
        <div className={styles.checkDesc}>{c.desc}</div>
      </div>
    );
  });

  // AI 분석
  const handleAiAnalyze = async () => {
    if (!aiText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText.slice(0, 8000), contractType: aiContractType }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "분석 중 오류가 발생했습니다."); return; }
      setAiResult(data);
    } catch {
      setAiError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  // 개인정보처리방침 페이지
  if (showPrivacy) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.brand} style={{ cursor: "pointer" }} onClick={() => setShowPrivacy(false)}>
              <span className={styles.brandMark}>온변</span>
              <span className={styles.brandFull}>온라인 변호사</span>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.privacyPage}>
            <h1 className={styles.privacyTitle}>개인정보처리방침</h1>
            <p className={styles.privacyDate}>최종 업데이트: 2025년 3월</p>
            <div className={styles.privacyBody}>
              <h2>1. 수집하는 개인정보</h2>
              <p>온변은 별도의 회원가입 없이 서비스를 이용할 수 있으며, 현재 개인정보를 수집하지 않습니다. AI 분석 기능 이용 시 입력하신 계약서 텍스트는 분석 완료 후 즉시 삭제됩니다.</p>
              <h2>2. 쿠키 및 분석 도구</h2>
              <p>서비스 개선을 위해 Google Analytics와 Google AdSense를 사용할 수 있습니다. 브라우저 설정을 통해 거부할 수 있습니다.</p>
              <h2>3. 제3자 제공</h2>
              <p>온변은 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
              <h2>4. 면책 조항</h2>
              <p>온변이 제공하는 모든 법률 정보는 참고 목적으로만 제공되며 법적 효력이 없습니다. 중요한 계약은 반드시 전문 변호사와 상담하시기 바랍니다.</p>
            </div>
            <button className={styles.backBtn} onClick={() => setShowPrivacy(false)}>← 돌아가기</button>
          </div>
        </main>
      </div>
    );
  }

  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CONTRACT_LIST.filter(item => {
      const catMatch = activeCategory === "all" || item.category === activeCategory;
      const searchMatch = !q || item.label.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [search, activeCategory]);

  const typeLabel = { contract: "계약서", application: "신청서류", list: "문서목록" };
  const typeColor = {
    contract:    { bg: "#eef2fd", text: "#2d5bbf" },
    application: { bg: "#f5f5f5", text: "#555555" },
    list:        { bg: "#f5f5f5", text: "#555555" },
  };

  return (
    <div className={styles.page}>
      {/* ─── 헤더 ─── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand} style={{ cursor: "pointer" }} onClick={() => handleTabChange("home")}>
            <span className={styles.brandMark}>온변</span>
            <span className={styles.brandFull}>온라인 변호사</span>
          </div>
          <nav className={styles.nav}>
            <button className={`${styles.navBtn} ${tab === "home" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("home")}>홈</button>
            <button className={`${styles.navBtn} ${tab === "list" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("list")}>전체 문서 목록</button>
            <button className={`${styles.navBtn} ${tab === "ai" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("ai")}>
              <span className={styles.navBtnNew}>AI 분석 <span className={styles.newBadge}>NEW</span></span>
            </button>
            <button className={styles.loginBtn} onClick={() => setShowLogin(true)}>로그인</button>
          </nav>
        </div>
      </header>

      {/* ─── 로그인 모달 ─── */}
      {showLogin && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTabs}>
                <button className={`${styles.modalTab} ${loginTab === "login" ? styles.modalTabActive : ""}`} onClick={() => setLoginTab("login")}>로그인</button>
                <button className={`${styles.modalTab} ${loginTab === "signup" ? styles.modalTabActive : ""}`} onClick={() => setLoginTab("signup")}>회원가입</button>
              </div>
              <button className={styles.modalClose} onClick={() => setShowLogin(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {loginTab === "login" ? (
                <>
                  <div className={styles.modalWelcome}>
                    <div className={styles.modalLogo}>온변</div>
                    <div className={styles.modalWelcomeText}>다시 만나서 반가워요!</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>이메일</label>
                    <input className={styles.formInput} type="email" placeholder="example@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>비밀번호</label>
                    <input className={styles.formInput} type="password" placeholder="비밀번호 입력" value={loginPw} onChange={e => setLoginPw(e.target.value)} />
                  </div>
                  <button className={styles.submitBtn}>로그인</button>
                  <div className={styles.dividerRow}><span>또는</span></div>
                  <button className={styles.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google로 계속하기
                  </button>
                  <div className={styles.modalFooterText}>계정이 없으신가요? <button className={styles.textLink} onClick={() => setLoginTab("signup")}>회원가입</button></div>
                </>
              ) : (
                <>
                  <div className={styles.modalWelcome}>
                    <div className={styles.modalLogo}>온변</div>
                    <div className={styles.modalWelcomeText}>온변에 오신 걸 환영해요!</div>
                    <div className={styles.modalWelcomeSub}>무료로 가입하고 AI 분석을 이용해보세요</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>이메일</label>
                    <input className={styles.formInput} type="email" placeholder="example@email.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>비밀번호</label>
                    <input className={styles.formInput} type="password" placeholder="8자 이상" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>비밀번호 확인</label>
                    <input className={styles.formInput} type="password" placeholder="비밀번호 재입력" />
                  </div>
                  <button className={styles.submitBtn}>무료로 시작하기</button>
                  <div className={styles.dividerRow}><span>또는</span></div>
                  <button className={styles.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google로 계속하기
                  </button>
                  <div className={styles.modalFooterText}>이미 계정이 있으신가요? <button className={styles.textLink} onClick={() => setLoginTab("login")}>로그인</button></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className={styles.main}>

        {/* ─── 홈 탭 ─── */}
        {tab === "home" && (
          <>
            {/* 히어로 */}
            <section className={styles.landingHero}>
              <div className={styles.landingHeroInner}>
                <div className={styles.landingLeft}>
                  <div className={styles.heroBadge}>무료 법률 정보 서비스</div>
                  <h1 className={styles.heroTitle}>계약서 앞에서<br />더 이상 을(乙)이<br />되지 않도록</h1>
                  <p className={styles.heroDesc}>변호사 비용 없이도 계약서의 위험 조항을 파악하세요.<br />121종 법률 문서 체크리스트를 무료로 제공합니다.</p>
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}><div className={styles.statNum}>121종</div><div className={styles.statLabel}>법률 문서</div></div>
                    <div className={styles.statItem}><div className={styles.statNum}>무료</div><div className={styles.statLabel}>기본 서비스</div></div>
                    <div className={styles.statItem}><div className={styles.statNum}>AI</div><div className={styles.statLabel}>계약서 분석</div></div>
                  </div>
                </div>
                <div className={styles.landingRight}>
                  <div className={styles.problemCard}>
                    <div className={styles.problemTitle}>📋 계약서, 읽기 어려우셨나요?</div>
                    <ul className={styles.problemList}>
                      <li>계약서 평균 10~30페이지, 법률 용어 가득</li>
                      <li>변호사 검토 비용 최소 10만 원~수십만 원</li>
                      <li>"몰랐다"는 이유로 손해 보는 사례 빈번</li>
                      <li>이용약관은 아무도 안 읽고 동의 클릭</li>
                    </ul>
                    <div className={styles.problemSolution}>온변이 핵심만 알려드려요 →</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 통합 검색 */}
            <div className={styles.homeSearchSection} ref={searchRef}>
              <div className={`${styles.searchBox} ${styles.homeSearchBox}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="계약서·신청서류·내용증명 등 검색..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                />
                {search && <button className={styles.searchClear} onClick={() => { setSearch(""); setShowResults(false); }}>✕</button>}
              </div>

              {/* 검색 결과 드롭다운 */}
              {showResults && searchResults.length > 0 && (
                <div className={styles.searchDropdown}>
                  {searchResults.map(item => {
                    const tc = typeColor[item.type];
                    return (
                      <div key={`${item.type}-${item.id}`} className={styles.searchResultItem} onClick={() => handleSelectResult(item)}>
                        <span className={styles.searchResultIcon}>{item.icon}</span>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultLabel}>{item.label}</div>
                          {item.summary && <div className={styles.searchResultSub}>{item.summary}</div>}
                        </div>
                        <span className={styles.searchResultType} style={{ background: tc.bg, color: tc.text }}>{typeLabel[item.type]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {showResults && search.trim() && searchResults.length === 0 && (
                <div className={styles.searchDropdown}>
                  <div className={styles.searchNoResult}>검색 결과가 없어요.</div>
                </div>
              )}
            </div>

            {/* 주로 사용하는 문서 */}
            <div className={styles.popularSection}>
              <div className={styles.popularTitle}>주로 사용하는 문서</div>
              <div className={styles.popularGrid}>
                {POPULAR_DOCS.map(doc => (
                  <button key={doc.id} className={styles.popularCard} onClick={() => handlePopularClick(doc)}>
                    <span className={styles.popularIcon}>{doc.icon}</span>
                    <div className={styles.popularLabel}>{doc.label}</div>
                    <div className={styles.popularDesc}>{doc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 문서 상세 */}
            {selectedItem && (
              <div className={styles.selectedDetail}>
                <div className={styles.selectedDetailHeader}>
                  <div className={styles.selectedDetailTitle}>
                    <span>{selectedItem.data.icon}</span>
                    <span>{selectedItem.data.label}</span>
                  </div>
                  <button className={styles.selectedDetailClose} onClick={() => setSelectedItem(null)}>✕ 닫기</button>
                </div>
                <div className={styles.selectedDetailBody}>
                  {selectedItem.type === "contract" && (
                    <>
                      <div className={styles.detailSection}>
                        <div className={styles.detailTitle}>체크리스트</div>
                        <div className={styles.checkList}>{renderChecklist(selectedItem.data.checklist)}</div>
                      </div>
                      <div className={styles.detailSection}>
                        <div className={styles.detailTitle}>실전 팁</div>
                        <ul className={styles.tipList}>{selectedItem.data.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                      </div>
                      {selectedItem.data.link && (
                        <a href={selectedItem.data.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>{selectedItem.data.linkLabel} →</a>
                      )}
                    </>
                  )}
                  {selectedItem.type === "application" && (
                    <>
                      <div className={styles.freshnessWarn}>⚠️ 정부 정책은 수시로 변경됩니다. 신청 전 반드시 공식 사이트에서 최신 내용을 확인하세요.</div>
                      {selectedItem.data.condition && <div className={styles.condition}>✓ {selectedItem.data.condition}</div>}
                      <div className={styles.detailSection}>
                        <div className={styles.detailTitle}>필요 서류</div>
                        {selectedItem.data.docs.map((d, i) => (
                          <div key={i} className={styles.docGroup}>
                            <div className={styles.docCategory}>{d.category}</div>
                            <ul className={styles.docList}>{d.items.map((doc, j) => <li key={j} className={styles.docItem}><span className={styles.docBullet}>·</span>{doc}</li>)}</ul>
                          </div>
                        ))}
                      </div>
                      <div className={styles.detailSection}>
                        <div className={styles.detailTitle}>주의사항</div>
                        <ul className={styles.tipList}>{selectedItem.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                      </div>
                      {selectedItem.data.link && (
                        <a href={selectedItem.data.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>{selectedItem.data.linkLabel} →</a>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ─── 요금제 ─── */}
            <section className={styles.pricingSection}>
              <div className={styles.pricingHeader}>
                <div className={styles.heroBadge}>요금제</div>
                <h2 className={styles.pricingTitle}>필요한 만큼만 사용하세요</h2>
                <p className={styles.pricingDesc}>기본 정보는 영원히 무료. AI 분석이 필요할 때 구독하세요.</p>
              </div>
              <div className={styles.pricingGrid}>
                {/* 무료 */}
                <div className={styles.pricingCard}>
                  <div className={styles.pricingPlanName}>무료</div>
                  <div className={styles.pricingPrice}><span className={styles.pricingAmount}>0</span><span className={styles.pricingUnit}>원</span></div>
                  <div className={styles.pricingPriceNote}>영구 무료</div>
                  <ul className={styles.pricingFeatures}>
                    <li className={styles.pricingFeatureOn}>✓ 121종 계약서 체크리스트</li>
                    <li className={styles.pricingFeatureOn}>✓ 신청 서류 안내</li>
                    <li className={styles.pricingFeatureOn}>✓ AI 분석 월 3회</li>
                    <li className={styles.pricingFeatureOff}>✗ 분석 내역 저장</li>
                    <li className={styles.pricingFeatureOff}>✗ 무제한 AI 분석</li>
                  </ul>
                  <button className={styles.pricingBtnOutline} onClick={() => setShowLogin(true)}>무료로 시작하기</button>
                </div>
                {/* 스탠다드 */}
                <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
                  <div className={styles.pricingBestBadge}>가장 인기</div>
                  <div className={styles.pricingPlanName}>스탠다드</div>
                  <div className={styles.pricingPrice}><span className={styles.pricingAmount}>9,900</span><span className={styles.pricingUnit}>원/월</span></div>
                  <div className={styles.pricingPriceNote}>연간 결제 시 월 7,900원</div>
                  <ul className={styles.pricingFeatures}>
                    <li className={styles.pricingFeatureOn}>✓ 무료 플랜 모든 기능</li>
                    <li className={styles.pricingFeatureOn}>✓ AI 분석 무제한</li>
                    <li className={styles.pricingFeatureOn}>✓ 분석 내역 30일 저장</li>
                    <li className={styles.pricingFeatureOn}>✓ PDF 업로드 분석</li>
                    <li className={styles.pricingFeatureOff}>✗ 팀 공유 기능</li>
                  </ul>
                  <button className={styles.pricingBtnFilled} onClick={() => setShowLogin(true)}>시작하기</button>
                </div>
                {/* 프로 */}
                <div className={styles.pricingCard}>
                  <div className={styles.pricingPlanName}>프로</div>
                  <div className={styles.pricingPrice}><span className={styles.pricingAmount}>29,900</span><span className={styles.pricingUnit}>원/월</span></div>
                  <div className={styles.pricingPriceNote}>연간 결제 시 월 24,900원</div>
                  <ul className={styles.pricingFeatures}>
                    <li className={styles.pricingFeatureOn}>✓ 스탠다드 모든 기능</li>
                    <li className={styles.pricingFeatureOn}>✓ 분석 내역 무제한 저장</li>
                    <li className={styles.pricingFeatureOn}>✓ 팀 공유 (최대 5명)</li>
                    <li className={styles.pricingFeatureOn}>✓ API 제공</li>
                    <li className={styles.pricingFeatureOn}>✓ 우선 고객 지원</li>
                  </ul>
                  <button className={styles.pricingBtnOutline} onClick={() => setShowLogin(true)}>시작하기</button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ─── 전체 문서 목록 탭 ─── */}
        {tab === "list" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>전체 문서 목록</div>
              <h1 className={styles.heroTitle}>필요한 문서를<br />빠르게 찾아보세요</h1>
              <p className={styles.heroDesc}>121종 이상의 법률 문서 주의사항을 제공합니다.</p>
            </section>
            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input className={styles.searchInput} type="text" placeholder="문서명으로 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>}
              </div>
            </div>
            <div className={styles.catRow}>
              <button className={`${styles.catBtn} ${activeCategory === "all" ? styles.catBtnActive : ""}`} onClick={() => setActiveCategory("all")}>전체 ({CONTRACT_LIST.length})</button>
              {CONTRACT_CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.catBtnActive : ""}`}
                  onClick={() => { setActiveCategory(c.id); setDocOpenId(null); }}>
                  {c.label} ({CONTRACT_LIST.filter(i => i.category === c.id).length})
                </button>
              ))}
            </div>
            <div className={styles.catRowMobile}>
              <button className={`${styles.catBtn} ${activeCategory === "all" ? styles.catBtnActive : ""}`} onClick={() => setActiveCategory("all")}>전체</button>
              {CONTRACT_CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.catBtnActive : ""}`}
                  onClick={() => { setActiveCategory(c.id); setDocOpenId(null); }}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className={styles.docGrid}>
              {filteredList.map(item => {
                const cat = CONTRACT_CATEGORIES.find(c => c.id === item.category);
                const isOpen = docOpenId === item.id;
                const detail = DOC_DETAILS[item.id];
                return (
                  <div key={item.id} className={`${styles.docCard} ${isOpen ? styles.docCardOpen : ""}`}
                    onClick={() => setDocOpenId(prev => prev === item.id ? null : item.id)}>
                    <div className={styles.docCardTop}>
                      <div><div className={styles.docCardLabel}>{item.label}</div>{cat && <div className={styles.docCardCat}>{cat.label}</div>}</div>
                      <span className={styles.docCardArrow}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div className={styles.docCardDetail}>
                        <div className={styles.divider} style={{ margin: "12px 0" }} />
                        {detail ? (
                          <>
                            <div className={styles.detailTitle}>체크리스트</div>
                            <div className={styles.checkList}>{renderChecklist(detail.checklist)}</div>
                            {detail.tips && (<><div className={styles.detailTitle} style={{ marginTop: 14 }}>실전 팁</div><ul className={styles.tipList}>{detail.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></>)}
                          </>
                        ) : (
                          <div className={styles.docCardNotice}>📌 상세 주의사항 업데이트 예정입니다.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredList.length === 0 && <div className={styles.empty}>검색 결과가 없어요.</div>}
            <div className={styles.listNote}>총 {CONTRACT_LIST.length}종 이상의 문서가 등록되어 있습니다.</div>
          </>
        )}

        {/* ─── AI 분석 탭 ─── */}
        {tab === "ai" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>AI 계약서 분석</div>
              <h1 className={styles.heroTitle}>계약서를 붙여넣으면<br />AI가 분석해드려요</h1>
              <p className={styles.heroDesc}>위험 조항을 자동 감지하고, 쉬운 말로 설명해드립니다.<br /><span className={styles.disclaimer}>※ 참고용이며 법적 효력이 없습니다. 중요한 계약은 변호사와 상담하세요.</span></p>
            </section>
            <div className={styles.aiSection}>
              <div className={styles.aiDisclaimer}>⚠️ 본 AI 분석은 참고용이며 법적 효력이 없습니다. 중요한 계약은 반드시 전문 변호사와 상담하세요.</div>
              <div className={styles.aiCard}>
                <div className={styles.aiCardLabel}>계약서 종류 선택 (선택사항)</div>
                <div className={styles.aiTypeRow}>
                  {["근로계약서", "프리랜서 계약서", "임대차 계약서", "이용약관", "투자·주주 계약", "기타"].map(t => (
                    <button key={t} className={`${styles.aiTypeBtn} ${aiContractType === t ? styles.aiTypeBtnActive : ""}`}
                      onClick={() => setAiContractType(prev => prev === t ? "" : t)}>{t}</button>
                  ))}
                </div>
                <div className={styles.aiCardLabel} style={{ marginTop: "1.25rem" }}>계약서 내용 붙여넣기</div>
                <textarea className={styles.aiTextarea} value={aiText} onChange={e => setAiText(e.target.value)} rows={10}
                  placeholder={"계약서나 약관 내용을 여기에 붙여넣으세요.\n\n최대 8,000자까지 분석 가능합니다."} />
                <div className={styles.aiCharCount}>{aiText.length.toLocaleString()} / 8,000자</div>
                <button className={styles.aiAnalyzeBtn} onClick={handleAiAnalyze} disabled={aiLoading || !aiText.trim()}>
                  {aiLoading ? <span className={styles.aiLoadingWrap}><span className={styles.dots}><span /><span /><span /></span>AI 분석 중... (10~30초)</span> : "🤖 AI 계약서 분석하기"}
                </button>
              </div>
              {aiError && <div className={styles.aiError}>{aiError}</div>}
              {aiResult && (
                <div className={styles.aiResult}>
                  <div className={styles.riskGauge}>
                    <div className={styles.riskHeader}>
                      <div><div className={styles.riskType}>{aiResult.type}</div><div className={styles.riskSummary}>{aiResult.summary}</div></div>
                      <div className={styles.riskBadge} style={{ background: RISK_LEVELS[aiResult.risk]?.bg, color: RISK_LEVELS[aiResult.risk]?.color, border: `1px solid ${RISK_LEVELS[aiResult.risk]?.color}40` }}>
                        {RISK_LEVELS[aiResult.risk]?.label || "확인"}
                      </div>
                    </div>
                    <div className={styles.riskBarWrap}>
                      <div className={styles.riskBarLabels}><span>안전</span><span>주의</span><span>위험</span></div>
                      <div className={styles.riskBarTrack}><div className={styles.riskBarFill} style={{ width: RISK_LEVELS[aiResult.risk]?.width || "50%", background: RISK_LEVELS[aiResult.risk]?.bar || "#d97706" }} /></div>
                    </div>
                  </div>
                  {aiResult.keyPoints?.length > 0 && (
                    <div className={styles.aiSection2}>
                      <div className={styles.aiSectionTitle}>📋 핵심 조항 요약</div>
                      <div className={styles.checkList}>{renderChecklist(aiResult.keyPoints.map(p => ({ ...p, level: p.level })))}</div>
                    </div>
                  )}
                  {aiResult.warnings?.length > 0 && (
                    <div className={styles.aiSection2}>
                      <div className={styles.aiSectionTitle}>🔴 주의해야 할 조항</div>
                      {aiResult.warnings.map((w, i) => (
                        <div key={i} className={styles.warningCard}><div className={styles.warningClause}>{w.clause}</div><div className={styles.warningDesc}>{w.desc}</div></div>
                      ))}
                    </div>
                  )}
                  <div className={styles.aiResultDisclaimer}>※ 위 분석 결과는 AI가 생성한 참고 정보이며 법적 효력이 없습니다. 중요한 계약은 반드시 전문 변호사와 상담하세요.</div>
                  <button className={styles.aiResetBtn} onClick={() => { setAiResult(null); setAiText(""); setAiContractType(""); }}>다시 분석하기</button>
                </div>
              )}

              {/* ─── AI 분석 샘플 예시 ─── */}
              {!aiResult && (
                <div className={styles.aiSampleSection}>
                  <div className={styles.aiSampleTitle}>💡 이런 결과를 받을 수 있어요</div>
                  <div className={styles.aiSampleCard}>
                    <div className={styles.aiSampleBadge}>실제 분석 예시 — 프리랜서 계약서</div>
                    <div className={styles.aiSampleRisk}>
                      <div className={styles.aiSampleRiskLeft}>
                        <div className={styles.aiSampleRiskLabel}>이 계약서는 프리랜서 용역계약서입니다.</div>
                        <div className={styles.aiSampleRiskSub}>전반적으로 주의가 필요합니다.</div>
                      </div>
                      <div className={styles.aiSampleRiskBadge}>⚠️ 주의</div>
                    </div>
                    <div className={styles.aiSampleBarWrap}>
                      <div className={styles.aiSampleBarLabels}><span>안전</span><span>주의</span><span>위험</span></div>
                      <div className={styles.aiSampleBarTrack}><div className={styles.aiSampleBarFill} /></div>
                    </div>
                    <div className={styles.aiSampleItems}>
                      <div className={styles.aiSampleItem} style={{ background: "#eef2fd", borderColor: "#c5d4f5" }}>
                        <div className={styles.aiSampleItemHeader}><span className={styles.aiSampleDot} style={{ background: "#5385E4" }} /><span style={{ color: "#2d5bbf", fontSize: 10, fontWeight: 700 }}>확인</span><span className={styles.aiSampleItemTitle}>계약 기간</span></div>
                        <div className={styles.aiSampleItemDesc}>1년, 자동 갱신 없음. 계약 만료 1개월 전 갱신 협의 필요.</div>
                      </div>
                      <div className={styles.aiSampleItem} style={{ background: "#fffbee", borderColor: "#ffe5a0" }}>
                        <div className={styles.aiSampleItemHeader}><span className={styles.aiSampleDot} style={{ background: "#d08600" }} /><span style={{ color: "#7a5000", fontSize: 10, fontWeight: 700 }}>주의</span><span className={styles.aiSampleItemTitle}>중도 해지 위약금</span></div>
                        <div className={styles.aiSampleItemDesc}>갑이 중도 해지할 경우 잔여 계약금의 30%를 위약금으로 지급해야 합니다.</div>
                      </div>
                      <div className={styles.aiSampleItem} style={{ background: "#fff1f1", borderColor: "#ffcccc" }}>
                        <div className={styles.aiSampleItemHeader}><span className={styles.aiSampleDot} style={{ background: "#e03535" }} /><span style={{ color: "#c00000", fontSize: 10, fontWeight: 700 }}>위험</span><span className={styles.aiSampleItemTitle}>지식재산권 귀속</span></div>
                        <div className={styles.aiSampleItemDesc}>작업물의 모든 권리가 발주사에 귀속되며, 포트폴리오 사용도 사전 승인이 필요합니다.</div>
                      </div>
                    </div>
                    <div className={styles.aiSampleBlur}>
                      <div className={styles.aiSampleBlurContent}>
                        <div className={styles.aiSampleBlurText}>+ 주의 조항 3개 더 있음</div>
                        <button className={styles.aiSampleBlurBtn} onClick={() => setShowLogin(true)}>로그인하고 전체 보기 →</button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.aiSampleNote}>실제 계약서를 붙여넣으면 위와 같은 맞춤 분석 결과를 받을 수 있어요.</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── 모바일 하단 여백 ─── */}
        <div className={styles.mobileBottomPad} />
      </main>

      {/* ─── 모바일 하단 탭바 ─── */}
      <nav className={styles.mobileTabBar}>
        <div className={styles.mobileTabInner}>
          {[{ id: "home", label: "홈", icon: "🏠" }, { id: "list", label: "문서목록", icon: "🗂️" }, { id: "ai", label: "AI분석", icon: "🤖" }].map(t => (
            <button key={t.id} className={`${styles.mobileTabBtn} ${tab === t.id ? styles.active : ""}`} onClick={() => handleTabChange(t.id)}>
              <span className={styles.mobileTabIcon}>{t.icon}</span>
              <span className={styles.mobileTabLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── 푸터 ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}><span className={styles.brandMark} style={{ fontSize: 14 }}>온변</span><span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>온라인 변호사</span></div>
          <p className={styles.footerDisc}>본 사이트의 모든 정보는 참고용이며 법적 효력이 없습니다. 중요한 계약은 반드시 전문 변호사와 상담하세요.</p>
          <div className={styles.footerLinks}>
            <button className={styles.footerLink} onClick={() => setShowPrivacy(true)}>개인정보처리방침</button>
            <span className={styles.footerDivider}>·</span>
            <span className={styles.footerCopy}>© 2025 온변. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
