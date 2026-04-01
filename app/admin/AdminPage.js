"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

const RISK_LABEL = { safe: "안전", caution: "주의", danger: "위험" };
const RISK_COLOR = { safe: "#2a9d5c", caution: "#d08600", danger: "#e03535" };
const PLAN_LABEL = { free: "무료", standard: "스탠다드", standard_yearly: "스탠다드(연)", pro: "프로", pro_yearly: "프로(연)" };


// ── 어드민 콘텐츠 편집 전용 헬퍼 컴포넌트 ──
// AdminPage 외부에 정의 → 매 렌더마다 새 함수가 생성되지 않아 textarea 포커스 유지
function AdminField({ styles, label, rows, value, defaultValue, onChange, onSave, saving, saved }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ fontSize:12, fontWeight:700, color:"#334155" }}>{label}</label>
        <button style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}
          onClick={() => onChange(defaultValue ?? "")}>↩ 기본값</button>
      </div>
      <textarea className={styles.fieldTextarea} rows={rows || 1}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        style={{ marginBottom:2, fontSize:13, resize:"vertical" }} />
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
        <button className={styles.sendBtn} style={{ padding:"5px 16px", fontSize:12 }}
          onClick={onSave} disabled={saving}>
          {saving ? "저장 중…" : saved ? "✓ 저장됨" : "저장"}
        </button>
      </div>
    </div>
  );
}

function AdminReviewCard({ styles, prefix, n, contentData, contentDefaults, onChangeField, onSaveAll }) {
  const keys = [
    [prefix + "_review" + n + "_quote",  "인용문",                               3],
    [prefix + "_review" + n + "_name",   "이름 (예: 김○○)",                      1],
    [prefix + "_review" + n + "_role",   "역할 (예: 직장인 29세 · 서울)",         1],
    [prefix + "_review" + n + "_result", "결과 뱃지 (예: 보증금 340만 원 미반환)", 1],
  ];
  return (
    <div style={{ background:"#f8fafc", borderRadius:12, border:"1px solid #e2e8f0", padding:"14px 16px", marginBottom:14 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:10 }}>리뷰 {n}</div>
      {keys.map(([k, lbl, r]) => (
        <div key={k} style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:2 }}>{lbl}</label>
          <textarea className={styles.fieldTextarea} rows={r}
            value={contentData[k] ?? ""}
            onChange={e => onChangeField(k, e.target.value)}
            style={{ marginBottom:1, fontSize:12 }} />
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
        <button style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}
          onClick={() => keys.forEach(([k]) => onChangeField(k, contentDefaults[k] ?? ""))}>
          ↩ 기본값으로
        </button>
        <button className={styles.sendBtn} style={{ padding:"6px 18px", fontSize:12 }}
          onClick={() => onSaveAll(keys.map(([k]) => k))}>
          리뷰 {n} 저장
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 유저 관리
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userQuery, setUserQuery] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [planEditing, setPlanEditing] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);

  // 랜딩 콘텐츠 편집
  const [contentData, setContentData] = useState(null);
  const contentDataRef = useRef(null); // stale closure 방지용 ref
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState({});
  const [contentSaved, setContentSaved] = useState({});
  const [contentDefaults, setContentDefaults] = useState({});
  const [sectionOrder, setSectionOrder] = useState([]);
  const [sectionHidden, setSectionHidden] = useState({});
  const [defaultSectionOrder, setDefaultSectionOrder] = useState([]);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // 이메일 발송
  const [emailType, setEmailType] = useState("legal_alert");
  const [emailFields, setEmailFields] = useState({ lawName: "", summary: "", link: "", title: "", content: "", ctaText: "", ctaUrl: "" });
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  // 접근 제어
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/");
  }, [status, session]);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") loadStats();
  }, [status, session]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loadUsers = async (page = 1, q = "") => {
    setUserLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUsers(data.items || []);
      setUserTotal(data.total || 0);
    } catch {}
    setUserLoading(false);
  };

  useEffect(() => {
    if (activeTab === "users") loadUsers(userPage, userQuery);
    if (activeTab === "content" && !contentData) loadContent();
  }, [activeTab, userPage]);

  const handlePlanChange = async (userId, plan) => {
    setPlanSaving(true);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
      setPlanEditing(null);
    } catch {}
    setPlanSaving(false);
  };

  // contentData를 ref로도 추적 — saveContent의 stale closure 문제 해결
  const updateContentData = useCallback((updater) => {
    setContentData(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      contentDataRef.current = next;
      return next;
    });
  }, []);

  const loadContent = async () => {
    setContentLoading(true);
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success) {
        contentDataRef.current = data.content;
        setContentData(data.content);
        setContentDefaults(data.defaults);
        setSectionOrder(data.sectionOrder || []);
        setSectionHidden(data.sectionHidden || []);
        setDefaultSectionOrder(data.defaultSectionOrder || []);
      }
    } catch {}
    setContentLoading(false);
  };

  const saveContent = useCallback(async (key) => {
    // ref에서 항상 최신 값을 읽어 stale closure 방지
    const value = contentDataRef.current?.[key] ?? "";
    setContentSaving(p => ({ ...p, [key]: true }));
    setContentSaved(p => ({ ...p, [key]: false }));
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        setContentSaved(p => ({ ...p, [key]: true }));
        setTimeout(() => setContentSaved(p => ({ ...p, [key]: false })), 2000);
      }
    } catch {}
    setContentSaving(p => ({ ...p, [key]: false }));
  }, []);

  const saveLayout = async (newOrder, newHidden) => {
    setLayoutSaving(true);
    try {
      await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionOrder: newOrder, sectionHidden: newHidden }),
      });
      setLayoutSaved(true);
      setTimeout(() => setLayoutSaved(false), 2000);
    } catch {}
    setLayoutSaving(false);
  };

  const moveSectionUp = (idx) => {
    if (idx === 0) return;
    const next = [...sectionOrder];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSectionOrder(next);
    saveLayout(next, sectionHidden);
  };

  const moveSectionDown = (idx) => {
    if (idx === sectionOrder.length - 1) return;
    const next = [...sectionOrder];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSectionOrder(next);
    saveLayout(next, sectionHidden);
  };

  const toggleSectionHidden = (id) => {
    const next = { ...sectionHidden, [id]: !sectionHidden[id] };
    setSectionHidden(next);
    saveLayout(sectionOrder, next);
  };

  const handleSendEmail = async () => {
    setEmailSending(true); setEmailResult(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: emailType, ...emailFields }),
      });
      const data = await res.json();
      setEmailResult(data);
    } catch (e) { setEmailResult({ error: e.message }); }
    setEmailSending(false);
  };

  if (status === "loading" || loading) {
    return <div className={styles.loadingWrap}><div className={styles.spinner} /></div>;
  }
  if (error) {
    return <div className={styles.errorWrap}><div className={styles.errorMsg}>⚠️ {error}</div><Link href="/">← 홈으로</Link></div>;
  }

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>온변</span>
            <span className={styles.adminBadge}>ADMIN</span>
          </Link>
          <div className={styles.headerRight}>
            <span className={styles.adminEmail}>{session?.user?.email}</span>
            <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/" })}>로그아웃</button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        {/* 사이드바 */}
        <nav className={styles.sidebar}>
          {[
            { id: "dashboard", label: "📊 대시보드" },
            { id: "users",     label: "👤 유저 관리" },
            { id: "email",     label: "📬 이메일 발송" },
            { id: "content",   label: "✏️ 콘텐츠 편집" },
            { id: "audit",     label: "🔒 감사 로그" },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.sidebarBtn} ${activeTab === t.id ? styles.sidebarBtnActive : ""}`}
              onClick={() => { setActiveTab(t.id); if (t.id === "users" && !users.length) loadUsers(1, ""); }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* 메인 */}
        <main className={styles.main}>

          {/* ── 대시보드 ── */}
          {activeTab === "dashboard" && stats && (
            <>
              <h1 className={styles.pageTitle}>대시보드</h1>
              <div className={styles.statsGrid}>
                {[
                  { label: "전체 유저", value: stats.stats.totalUsers.toLocaleString(), sub: `유료 ${stats.stats.paidUsers}명` },
                  { label: "전체 분석", value: stats.stats.totalAnalysis.toLocaleString(), sub: "누적" },
                  { label: "이번 달 분석", value: stats.stats.monthlyAnalysis.toLocaleString(), sub: "이번 달" },
                  { label: "무료 유저", value: stats.stats.freeUsers.toLocaleString(), sub: `전환율 ${stats.stats.totalUsers ? Math.round(stats.stats.paidUsers / stats.stats.totalUsers * 100) : 0}%` },
                ].map(s => (
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div className={styles.statValue}>{s.value}</div>
                    <div className={styles.statSub}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* 위험도 분포 */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>분석 위험도 분포</h2>
                <div className={styles.riskRow}>
                  {Object.entries(stats.riskBreakdown).map(([k, v]) => {
                    const total = Object.values(stats.riskBreakdown).reduce((a, b) => a + b, 0);
                    const pct = total ? Math.round(v / total * 100) : 0;
                    return (
                      <div key={k} className={styles.riskBar}>
                        <div className={styles.riskBarLabel} style={{ color: RISK_COLOR[k] }}>{RISK_LABEL[k]}</div>
                        <div className={styles.riskBarTrack}>
                          <div className={styles.riskBarFill} style={{ width: `${pct}%`, background: RISK_COLOR[k] }} />
                        </div>
                        <div className={styles.riskBarVal}>{v}건 ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 최근 분석 */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>최근 분석 내역</h2>
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>계약서 유형</span><span>위험도</span><span>요약</span><span>일시</span>
                  </div>
                  {stats.recentAnalysis.map(a => (
                    <div key={a.id} className={styles.tableRow}>
                      <span>{a.contract_type || "-"}</span>
                      <span style={{ color: RISK_COLOR[a.risk], fontWeight: 600 }}>{RISK_LABEL[a.risk] || "-"}</span>
                      <span className={styles.truncate}>{a.summary?.slice(0, 40) || "-"}</span>
                      <span className={styles.mono}>{new Date(a.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── 유저 관리 ── */}
          {activeTab === "users" && (
            <>
              <h1 className={styles.pageTitle}>유저 관리</h1>
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  placeholder="이메일·이름·닉네임 검색"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadUsers(1, userQuery)}
                />
                <button className={styles.searchBtn} onClick={() => loadUsers(1, userQuery)}>검색</button>
              </div>
              <div className={styles.tableInfo}>총 {userTotal}명</div>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>이메일</span><span>닉네임</span><span>플랜</span><span>가입일</span><span>수정</span>
                </div>
                {userLoading
                  ? <div className={styles.tableEmpty}>로딩 중...</div>
                  : users.map(u => (
                    <div key={u.id} className={styles.tableRow}>
                      <span className={styles.truncate}>{u.email}</span>
                      <span>{u.nickname || u.name?.split(" ")[0] || "-"}</span>
                      <span>
                        {planEditing === u.id ? (
                          <select
                            className={styles.planSelect}
                            defaultValue={u.plan}
                            onChange={e => handlePlanChange(u.id, e.target.value)}
                            disabled={planSaving}
                          >
                            {Object.entries(PLAN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        ) : (
                          <span className={styles.planBadge} style={{ color: u.plan !== "free" ? "#5385E4" : "#888" }}>
                            {PLAN_LABEL[u.plan] || u.plan}
                          </span>
                        )}
                      </span>
                      <span className={styles.mono}>{new Date(u.created_at).toLocaleDateString("ko-KR")}</span>
                      <span>
                        <button className={styles.editBtn} onClick={() => setPlanEditing(planEditing === u.id ? null : u.id)}>
                          {planEditing === u.id ? "취소" : "수정"}
                        </button>
                      </span>
                    </div>
                  ))
                }
              </div>
              {/* 페이지네이션 */}
              <div className={styles.pagination}>
                {Array.from({ length: Math.ceil(userTotal / 20) }, (_, i) => i + 1).slice(0, 10).map(p => (
                  <button key={p} className={`${styles.pageBtn} ${p === userPage ? styles.pageBtnActive : ""}`}
                    onClick={() => { setUserPage(p); loadUsers(p, userQuery); }}>{p}</button>
                ))}
              </div>
            </>
          )}

          {/* ── 이메일 발송 ── */}
          {activeTab === "email" && (
            <>
              <h1 className={styles.pageTitle}>이메일 발송</h1>
              <div className={styles.emailCard}>
                <div className={styles.emailTypeRow}>
                  {[{ id: "legal_alert", label: "📋 법령 변경 알림" }, { id: "service_update", label: "🔔 서비스 업데이트" }].map(t => (
                    <button key={t.id} className={`${styles.emailTypeBtn} ${emailType === t.id ? styles.emailTypeBtnActive : ""}`}
                      onClick={() => setEmailType(t.id)}>{t.label}</button>
                  ))}
                </div>

                {emailType === "legal_alert" ? (
                  <>
                    <label className={styles.fieldLabel}>법령명</label>
                    <input className={styles.fieldInput} placeholder="예: 최저임금법 시행령" value={emailFields.lawName} onChange={e => setEmailFields(p => ({ ...p, lawName: e.target.value }))} />
                    <label className={styles.fieldLabel}>변경 내용 요약</label>
                    <textarea className={styles.fieldTextarea} placeholder="변경된 내용을 간략히 설명하세요." value={emailFields.summary} onChange={e => setEmailFields(p => ({ ...p, summary: e.target.value }))} rows={4} />
                    <label className={styles.fieldLabel}>관련 링크 (선택)</label>
                    <input className={styles.fieldInput} placeholder="https://..." value={emailFields.link} onChange={e => setEmailFields(p => ({ ...p, link: e.target.value }))} />
                  </>
                ) : (
                  <>
                    <label className={styles.fieldLabel}>제목</label>
                    <input className={styles.fieldInput} placeholder="예: 새 기능이 추가됐어요" value={emailFields.title} onChange={e => setEmailFields(p => ({ ...p, title: e.target.value }))} />
                    <label className={styles.fieldLabel}>본문</label>
                    <textarea className={styles.fieldTextarea} placeholder="이메일 본문 내용" value={emailFields.content} onChange={e => setEmailFields(p => ({ ...p, content: e.target.value }))} rows={5} />
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldHalf}>
                        <label className={styles.fieldLabel}>버튼 텍스트</label>
                        <input className={styles.fieldInput} placeholder="확인하기" value={emailFields.ctaText} onChange={e => setEmailFields(p => ({ ...p, ctaText: e.target.value }))} />
                      </div>
                      <div className={styles.fieldHalf}>
                        <label className={styles.fieldLabel}>버튼 링크</label>
                        <input className={styles.fieldInput} placeholder="https://..." value={emailFields.ctaUrl} onChange={e => setEmailFields(p => ({ ...p, ctaUrl: e.target.value }))} />
                      </div>
                    </div>
                  </>
                )}

                <button className={styles.sendBtn} onClick={handleSendEmail} disabled={emailSending}>
                  {emailSending ? "발송 중..." : "📨 이메일 발송"}
                </button>

                {emailResult && (
                  <div className={`${styles.emailResult} ${emailResult.error ? styles.emailResultError : styles.emailResultOk}`}>
                    {emailResult.error
                      ? `❌ 오류: ${emailResult.error}`
                      : `✅ 발송 완료 — 성공 ${emailResult.sent}명 / 실패 ${emailResult.failed}명 / 전체 ${emailResult.total}명`}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 콘텐츠 편집 ── */}
          {activeTab === "content" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <h1 className={styles.pageTitle} style={{ margin:0 }}>랜딩페이지 편집</h1>
                <a href="https://onbyun.vercel.app/" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:12, color:"#3C91E6", textDecoration:"none", background:"#e8f3fd", padding:"6px 14px", borderRadius:20, fontWeight:600 }}>
                  사이트 미리보기 →
                </a>
              </div>
              <p style={{ fontSize:13, color:"#94a3b8", marginBottom:24 }}>
                좌측에서 섹션을 클릭하면 우측에 편집 패널이 열립니다. ▲▼로 순서 변경, 👁️로 섹션 숨김/표시.
              </p>
              {contentLoading ? (
                <div className={styles.tableEmpty}>로딩 중...</div>
              ) : contentData ? (
                <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20, alignItems:"flex-start" }}>

                  {/* 좌측 — 섹션 목록 */}
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {sectionOrder.map((secId, idx) => {
                      const INFO = {
                        hero:      { label:"S1 — 히어로",       icon:"🏠", bg:"#e8f3fd", fg:"#1d4ed8" },
                        contracts: { label:"S2 — 계약서 유형",   icon:"📋", bg:"#f0fdf4", fg:"#166534" },
                        problem:   { label:"S3 — 문제 공감",     icon:"💬", bg:"#fff7ed", fg:"#9a3412" },
                        hiw:       { label:"S4 — 사용 방법",     icon:"🔢", bg:"#f5f3ff", fg:"#6d28d9" },
                        proof:     { label:"S5 — 사회적 증명",   icon:"⭐", bg:"#fefce8", fg:"#854d0e" },
                        features:  { label:"S6 — 핵심 기능",     icon:"✦",  bg:"#f0f9ff", fg:"#0369a1" },
                        pricing:   { label:"S7 — 요금제",        icon:"💳", bg:"#fff1f2", fg:"#9f1239" },
                        faq:       { label:"S8 — FAQ",           icon:"❓", bg:"#faf5ff", fg:"#7c3aed" },
                        feedback:  { label:"S8-2 — 불편사항",    icon:"📬", bg:"#f0fdf4", fg:"#166534" },
                        cta:       { label:"S9 — 최하단 CTA",    icon:"🚀", bg:"#eff6ff", fg:"#1d4ed8" },
                      };
                      const info = INFO[secId] || { label:secId, icon:"•", bg:"#f8fafc", fg:"#334155" };
                      const isHidden = !!sectionHidden[secId];
                      const isActive = activeSection === secId;
                      return (
                        <div key={secId}
                          onClick={() => setActiveSection(isActive ? null : secId)}
                          style={{
                            display:"flex", alignItems:"center", gap:8,
                            background: isActive ? info.bg : "#fff",
                            border:`1.5px solid ${isActive ? info.fg : "#e2e8f0"}`,
                            borderRadius:10, padding:"9px 10px", cursor:"pointer",
                            opacity: isHidden ? 0.45 : 1, transition:"all 0.15s",
                          }}>
                          <span style={{ fontSize:16 }}>{info.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:info.fg, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{info.label}</div>
                            {isHidden && <div style={{ fontSize:10, color:"#94a3b8" }}>숨김</div>}
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                            <button onClick={e => { e.stopPropagation(); moveSectionUp(idx); }}
                              disabled={idx === 0}
                              style={{ background:"none", border:"none", fontSize:9, color:idx===0?"#e2e8f0":"#64748b", cursor:idx===0?"default":"pointer", lineHeight:1, padding:"1px 3px" }}>▲</button>
                            <button onClick={e => { e.stopPropagation(); moveSectionDown(idx); }}
                              disabled={idx === sectionOrder.length - 1}
                              style={{ background:"none", border:"none", fontSize:9, color:idx===sectionOrder.length-1?"#e2e8f0":"#64748b", cursor:idx===sectionOrder.length-1?"default":"pointer", lineHeight:1, padding:"1px 3px" }}>▼</button>
                          </div>
                          <button onClick={e => { e.stopPropagation(); toggleSectionHidden(secId); }}
                            title={isHidden ? "표시하기" : "숨기기"}
                            style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, padding:"2px 3px", opacity:isHidden?0.4:1 }}>
                            {isHidden ? "🙈" : "👁️"}
                          </button>
                        </div>
                      );
                    })}
                    <button
                      style={{ fontSize:11, color:"#94a3b8", background:"none", border:"1px dashed #e2e8f0", borderRadius:8, padding:"7px", cursor:"pointer", marginTop:2 }}
                      onClick={() => { setSectionOrder([...defaultSectionOrder]); setSectionHidden({}); saveLayout([...defaultSectionOrder], {}); }}>
                      ↩ 순서 초기화
                    </button>
                    {layoutSaved && <div style={{ fontSize:11, color:"#22c55e", textAlign:"center", fontWeight:600 }}>✓ 레이아웃 저장됨</div>}
                  </div>

                  {/* 우측 — 편집 패널 */}
                  <div>
                    {!activeSection && (
                      <div style={{ background:"#f8fafc", border:"1.5px dashed #e2e8f0", borderRadius:16, padding:"60px 24px", textAlign:"center" }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
                        <div style={{ fontSize:15, fontWeight:600, color:"#334155", marginBottom:6 }}>좌측에서 섹션을 선택하세요</div>
                        <div style={{ fontSize:13, color:"#94a3b8" }}>선택한 섹션의 텍스트와 리뷰를 편집할 수 있습니다.</div>
                      </div>
                    )}

                    {activeSection === "hero" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>🏠</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S1 — 히어로 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="헤드라인" rows={2}
                          value={contentData["hero_headline"]} defaultValue={contentDefaults["hero_headline"]}
                          onChange={v => updateContentData(p => ({ ...p, hero_headline: v }))}
                          onSave={() => saveContent("hero_headline")}
                          saving={contentSaving["hero_headline"]} saved={contentSaved["hero_headline"]} />
                        <AdminField styles={styles} label="서브 카피" rows={2}
                          value={contentData["hero_subheadline"]} defaultValue={contentDefaults["hero_subheadline"]}
                          onChange={v => updateContentData(p => ({ ...p, hero_subheadline: v }))}
                          onSave={() => saveContent("hero_subheadline")}
                          saving={contentSaving["hero_subheadline"]} saved={contentSaved["hero_subheadline"]} />
                        <AdminField styles={styles} label="뱃지 텍스트" rows={1}
                          value={contentData["hero_badge"]} defaultValue={contentDefaults["hero_badge"]}
                          onChange={v => updateContentData(p => ({ ...p, hero_badge: v }))}
                          onSave={() => saveContent("hero_badge")}
                          saving={contentSaving["hero_badge"]} saved={contentSaved["hero_badge"]} />
                        <AdminField styles={styles} label="메인 버튼 텍스트" rows={1}
                          value={contentData["hero_cta_primary"]} defaultValue={contentDefaults["hero_cta_primary"]}
                          onChange={v => updateContentData(p => ({ ...p, hero_cta_primary: v }))}
                          onSave={() => saveContent("hero_cta_primary")}
                          saving={contentSaving["hero_cta_primary"]} saved={contentSaved["hero_cta_primary"]} />
                        <AdminField styles={styles} label="보조 버튼 텍스트" rows={1}
                          value={contentData["hero_cta_secondary"]} defaultValue={contentDefaults["hero_cta_secondary"]}
                          onChange={v => updateContentData(p => ({ ...p, hero_cta_secondary: v }))}
                          onSave={() => saveContent("hero_cta_secondary")}
                          saving={contentSaving["hero_cta_secondary"]} saved={contentSaved["hero_cta_secondary"]} />
                      </div>
                    )}

                    {activeSection === "contracts" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>📋</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S2 — 계약서 유형 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["contracts_title"]} defaultValue={contentDefaults["contracts_title"]}
                          onChange={v => updateContentData(p => ({ ...p, contracts_title: v }))}
                          onSave={() => saveContent("contracts_title")}
                          saving={contentSaving["contracts_title"]} saved={contentSaved["contracts_title"]} />
                        <AdminField styles={styles} label="섹션 설명" rows={2}
                          value={contentData["contracts_sub"]} defaultValue={contentDefaults["contracts_sub"]}
                          onChange={v => updateContentData(p => ({ ...p, contracts_sub: v }))}
                          onSave={() => saveContent("contracts_sub")}
                          saving={contentSaving["contracts_sub"]} saved={contentSaved["contracts_sub"]} />
                        <div style={{ background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#475569" }}>
                          💡 계약서 카드 6개는 Landing.js의 CONTRACT_TYPES 배열에서 관리합니다.
                        </div>
                      </div>
                    )}

                    {activeSection === "problem" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>💬</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S3 — 문제 공감 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["problem_title"]} defaultValue={contentDefaults["problem_title"]}
                          onChange={v => updateContentData(p => ({ ...p, problem_title: v }))}
                          onSave={() => saveContent("problem_title")}
                          saving={contentSaving["problem_title"]} saved={contentSaved["problem_title"]} />
                        <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:16 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>📝 인용 리뷰 편집 (이름은 ○○ 처리 필수)</div>
                          <AdminReviewCard styles={styles} prefix="problem" n={1} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                          <AdminReviewCard styles={styles} prefix="problem" n={2} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                          <AdminReviewCard styles={styles} prefix="problem" n={3} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                        </div>
                      </div>
                    )}

                    {activeSection === "hiw" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>🔢</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S4 — 사용 방법 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["hiw_title"]} defaultValue={contentDefaults["hiw_title"]}
                          onChange={v => updateContentData(p => ({ ...p, hiw_title: v }))}
                          onSave={() => saveContent("hiw_title")}
                          saving={contentSaving["hiw_title"]} saved={contentSaved["hiw_title"]} />
                        <AdminField styles={styles} label="섹션 설명" rows={2}
                          value={contentData["hiw_sub"]} defaultValue={contentDefaults["hiw_sub"]}
                          onChange={v => updateContentData(p => ({ ...p, hiw_sub: v }))}
                          onSave={() => saveContent("hiw_sub")}
                          saving={contentSaving["hiw_sub"]} saved={contentSaved["hiw_sub"]} />
                        <div style={{ background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#475569" }}>
                          💡 3단계 아이콘·번호·설명은 Landing.js의 STEPS 배열에서 관리합니다.
                        </div>
                      </div>
                    )}

                    {activeSection === "proof" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>⭐</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S5 — 사회적 증명 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["proof_title"]} defaultValue={contentDefaults["proof_title"]}
                          onChange={v => updateContentData(p => ({ ...p, proof_title: v }))}
                          onSave={() => saveContent("proof_title")}
                          saving={contentSaving["proof_title"]} saved={contentSaved["proof_title"]} />
                        <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:16 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>⭐ 성공 리뷰 편집 (이름은 ○○ 처리 필수)</div>
                          <AdminReviewCard styles={styles} prefix="proof" n={1} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                          <AdminReviewCard styles={styles} prefix="proof" n={2} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                          <AdminReviewCard styles={styles} prefix="proof" n={3} contentData={contentData} contentDefaults={contentDefaults}
                            onChangeField={(k, v) => updateContentData(p => ({ ...p, [k]: v }))}
                            onSaveAll={ks => ks.reduce((acc, k) => acc.then(() => saveContent(k)), Promise.resolve())} />
                        </div>
                      </div>
                    )}

                    {activeSection === "features" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                          <span style={{ fontSize:20 }}>✦</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S6 — 핵심 기능 섹션</h2>
                        </div>
                        <div style={{ background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, padding:"16px", fontSize:13, color:"#475569", lineHeight:1.8 }}>
                          체크리스트·AI 분석 기능 설명 섹션입니다.<br/>
                          텍스트는 Landing.js FeaturesSection에서 직접 관리됩니다.<br/>
                          섹션을 숨기려면 좌측 👁️ 버튼을 사용하세요.
                        </div>
                      </div>
                    )}

                    {activeSection === "pricing" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>💳</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S7 — 요금제 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["pricing_title"]} defaultValue={contentDefaults["pricing_title"]}
                          onChange={v => updateContentData(p => ({ ...p, pricing_title: v }))}
                          onSave={() => saveContent("pricing_title")}
                          saving={contentSaving["pricing_title"]} saved={contentSaved["pricing_title"]} />
                        <AdminField styles={styles} label="섹션 설명" rows={2}
                          value={contentData["pricing_sub"]} defaultValue={contentDefaults["pricing_sub"]}
                          onChange={v => updateContentData(p => ({ ...p, pricing_sub: v }))}
                          onSave={() => saveContent("pricing_sub")}
                          saving={contentSaving["pricing_sub"]} saved={contentSaved["pricing_sub"]} />
                        <div style={{ background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#9f1239" }}>
                          💡 플랜별 가격·기능은 Landing.js의 PLANS 배열에서 관리합니다. 유료 플랜 활성화: disabled: true → false.
                        </div>
                      </div>
                    )}

                    {activeSection === "faq" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>❓</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S8 — FAQ 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="섹션 제목" rows={1}
                          value={contentData["faq_title"]} defaultValue={contentDefaults["faq_title"]}
                          onChange={v => updateContentData(p => ({ ...p, faq_title: v }))}
                          onSave={() => saveContent("faq_title")}
                          saving={contentSaving["faq_title"]} saved={contentSaved["faq_title"]} />
                        <div style={{ background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#475569" }}>
                          💡 FAQ 질문·답변 항목은 Landing.js의 FAQS 배열에서 관리합니다.
                        </div>
                      </div>
                    )}

                    {activeSection === "feedback" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                          <span style={{ fontSize:20 }}>📬</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S8-2 — 불편사항 접수</h2>
                        </div>
                        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, padding:"16px", fontSize:13, color:"#166534", lineHeight:1.7 }}>
                          불편사항 폼 섹션입니다. /api/feedback → Supabase feedback 테이블에 저장됩니다.<br/>
                          섹션을 숨기려면 좌측 👁️ 버튼을 클릭하세요.
                        </div>
                      </div>
                    )}

                    {activeSection === "cta" && (
                      <div className={styles.emailCard}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                          <span style={{ fontSize:20 }}>🚀</span>
                          <h2 className={styles.sectionTitle} style={{ margin:0 }}>S9 — 최하단 CTA 섹션</h2>
                        </div>
                        <AdminField styles={styles} label="헤드라인" rows={2}
                          value={contentData["cta_headline"]} defaultValue={contentDefaults["cta_headline"]}
                          onChange={v => updateContentData(p => ({ ...p, cta_headline: v }))}
                          onSave={() => saveContent("cta_headline")}
                          saving={contentSaving["cta_headline"]} saved={contentSaved["cta_headline"]} />
                        <AdminField styles={styles} label="서브카피" rows={2}
                          value={contentData["cta_sub"]} defaultValue={contentDefaults["cta_sub"]}
                          onChange={v => updateContentData(p => ({ ...p, cta_sub: v }))}
                          onSave={() => saveContent("cta_sub")}
                          saving={contentSaving["cta_sub"]} saved={contentSaved["cta_sub"]} />
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className={styles.tableEmpty}>콘텐츠를 불러올 수 없습니다.</div>
              )}
            </>
          )}

          {/* ── 감사 로그 ── */}
          {activeTab === "audit" && (
            <>
              <h1 className={styles.pageTitle}>감사 로그</h1>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>어드민 ID</span><span>행위</span><span>대상</span><span>일시</span>
                </div>
                {stats?.auditLogs?.length === 0
                  ? <div className={styles.tableEmpty}>감사 로그가 없습니다.</div>
                  : (stats?.auditLogs || []).map(log => (
                    <div key={log.id} className={styles.tableRow}>
                      <span className={styles.mono}>{log.admin_id?.slice(0, 10)}...</span>
                      <span className={styles.auditAction}>{log.action}</span>
                      <span className={styles.truncate}>{log.target}</span>
                      <span className={styles.mono}>{new Date(log.created_at).toLocaleString("ko-KR")}</span>
                    </div>
                  ))
                }
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
