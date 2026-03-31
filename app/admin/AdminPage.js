"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

const RISK_LABEL = { safe: "안전", caution: "주의", danger: "위험" };
const RISK_COLOR = { safe: "#2a9d5c", caution: "#d08600", danger: "#e03535" };
const PLAN_LABEL = { free: "무료", standard: "스탠다드", standard_yearly: "스탠다드(연)", pro: "프로", pro_yearly: "프로(연)" };

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
