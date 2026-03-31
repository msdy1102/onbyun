"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./mypage.module.css";

const PLAN_INFO = {
  free:            { label: "무료 플랜",        color: "#888",   bg: "#f5f5f3", icon: "🆓" },
  standard:        { label: "스탠다드",          color: "#5385E4", bg: "#eef2fd", icon: "⭐" },
  standard_yearly: { label: "스탠다드 연간",     color: "#5385E4", bg: "#eef2fd", icon: "⭐" },
  pro:             { label: "프로",              color: "#7c3aed", bg: "#f3eeff", icon: "💎" },
  pro_yearly:      { label: "프로 연간",         color: "#7c3aed", bg: "#f3eeff", icon: "💎" },
};

export default function MyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 닉네임 인라인 편집
  const [nickEdit, setNickEdit] = useState(false);
  const [nickVal, setNickVal]   = useState("");
  const [nickErr, setNickErr]   = useState("");
  const [nickSaving, setNickSaving] = useState(false);
  const nickInputRef = useRef(null);

  // 알림 토글
  const [emailLegal,     setEmailLegal]     = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved,  setNotifSaved]  = useState(false);

  // 탈퇴 확인
  const [withdrawStep, setWithdrawStep] = useState(0); // 0=hidden, 1=confirm, 2=done

  // 토스트
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") loadProfile();
  }, [status]);

  useEffect(() => {
    if (nickEdit && nickInputRef.current) nickInputRef.current.focus();
  }, [nickEdit]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/profile");
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setNickVal(data.user.nickname || data.user.name?.split(" ")[0] || "");
        setEmailLegal(data.user.email_legal ?? true);
        setEmailMarketing(data.user.email_marketing ?? false);
      }
    } catch {}
    setLoading(false);
  };

  const saveNickname = async () => {
    const v = nickVal.trim();
    if (!v) { setNickErr("닉네임을 입력하세요"); return; }
    if (v.length > 20) { setNickErr("20자 이하로 입력하세요"); return; }
    if (!/^[\w\uAC00-\uD7A3\s-]+$/.test(v)) { setNickErr("한글, 영문, 숫자만 가능"); return; }
    setNickSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: v }),
      });
      if (!res.ok) throw new Error();
      await update();
      setProfile(p => ({ ...p, nickname: v }));
      setNickEdit(false);
      setNickErr("");
      showToast("닉네임이 변경됐어요 ✓");
    } catch { setNickErr("저장 실패. 다시 시도하세요"); }
    setNickSaving(false);
  };

  const saveNotif = async (field, value) => {
    setNotifSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setProfile(p => ({ ...p, [field]: value }));
      showToast("저장됐어요 ✓");
    } catch { showToast("저장 실패"); }
    setNotifSaving(false);
  };

  const handleWithdraw = async () => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_new_user: true }),
    });
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const plan = PLAN_INFO[profile?.plan] || PLAN_INFO.free;
  const displayName = profile?.nickname || profile?.name?.split(" ")[0] || "사용자";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className={styles.page}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>내 정보</span>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.body}>

        {/* ── 프로필 카드 ── */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {profile?.image
              ? <img src={profile.image} alt="프로필" className={styles.avatar} />
              : <div className={styles.avatarFallback}>{displayName[0]}</div>
            }
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{displayName}</div>
            <div className={styles.profileEmail}>{profile?.email}</div>
            <div className={styles.planChip} style={{ color: plan.color, background: plan.bg }}>
              {plan.icon} {plan.label}
            </div>
          </div>
        </div>

        {/* ── 닉네임 섹션 ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>닉네임</div>
          {nickEdit ? (
            <div className={styles.nickEditWrap}>
              <input
                ref={nickInputRef}
                className={`${styles.nickInput} ${nickErr ? styles.nickInputErr : ""}`}
                value={nickVal}
                maxLength={20}
                onChange={e => { setNickVal(e.target.value); setNickErr(""); }}
                onKeyDown={e => { if (e.key === "Enter") saveNickname(); if (e.key === "Escape") { setNickEdit(false); setNickErr(""); } }}
                placeholder="닉네임 (1~20자)"
              />
              <div className={styles.nickBtnRow}>
                <button className={styles.nickCancelBtn} onClick={() => { setNickEdit(false); setNickErr(""); setNickVal(profile?.nickname || profile?.name?.split(" ")[0] || ""); }}>취소</button>
                <button className={styles.nickSaveBtn} onClick={saveNickname} disabled={nickSaving}>
                  {nickSaving ? "저장 중..." : "저장"}
                </button>
              </div>
              {nickErr && <div className={styles.nickErr}>{nickErr}</div>}
            </div>
          ) : (
            <div className={styles.menuRow} onClick={() => setNickEdit(true)}>
              <span className={styles.menuVal}>{displayName}</span>
              <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}
        </div>

        {/* ── 계정 정보 ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>계정 정보</div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>이메일</span>
            <span className={styles.infoVal}>{profile?.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>로그인</span>
            <span className={styles.infoVal}>
              <span className={styles.googleTag}>
                <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Google
              </span>
            </span>
          </div>
          {joinDate && (
            <div className={styles.infoRow} style={{ border: "none" }}>
              <span className={styles.infoKey}>가입일</span>
              <span className={styles.infoVal}>{joinDate}</span>
            </div>
          )}
        </div>

        {/* ── 이메일 알림 ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>이메일 알림</div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>법령 변경 알림</span>
              <span className={styles.toggleDesc}>최저임금·임대차법 변경 시 알림</span>
            </div>
            <button
              className={`${styles.toggle} ${emailLegal ? styles.toggleOn : ""}`}
              onClick={() => { const v = !emailLegal; setEmailLegal(v); saveNotif("email_legal", v); }}
              disabled={notifSaving}
              role="switch" aria-checked={emailLegal}
            ><div className={styles.toggleThumb} /></button>
          </div>
          <div className={styles.toggleRow} style={{ border: "none" }}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>서비스 업데이트 <span className={styles.optTag}>선택</span></span>
              <span className={styles.toggleDesc}>신규 기능 및 혜택 소식</span>
            </div>
            <button
              className={`${styles.toggle} ${emailMarketing ? styles.toggleOn : ""}`}
              onClick={() => { const v = !emailMarketing; setEmailMarketing(v); saveNotif("email_marketing", v); }}
              disabled={notifSaving}
              role="switch" aria-checked={emailMarketing}
            ><div className={styles.toggleThumb} /></button>
          </div>
        </div>

        {/* ── 이용 플랜 ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>이용 플랜</div>
          <div className={styles.planRow}>
            <div>
              <div className={styles.planName} style={{ color: plan.color }}>{plan.label}</div>
              <div className={styles.planDesc}>
                {profile?.plan === "free" ? "AI 분석 월 1회 무료" : "AI 분석 무제한"}
              </div>
            </div>
            {profile?.plan === "free" && (
              <Link href="/?tab=home#pricing" className={styles.upgradeBtn}>업그레이드</Link>
            )}
          </div>
        </div>

        {/* ── 로그아웃 ── */}
        <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/" })}>
          로그아웃
        </button>

        {/* ── 회원탈퇴 ── */}
        <div className={styles.withdrawWrap}>
          {withdrawStep === 0 && (
            <button className={styles.withdrawLink} onClick={() => setWithdrawStep(1)}>회원 탈퇴</button>
          )}
          {withdrawStep === 1 && (
            <div className={styles.withdrawBox}>
              <p className={styles.withdrawMsg}>탈퇴하면 모든 데이터가 삭제되며 복구할 수 없어요.</p>
              <div className={styles.withdrawBtns}>
                <button className={styles.withdrawCancel} onClick={() => setWithdrawStep(0)}>취소</button>
                <button className={styles.withdrawConfirm} onClick={handleWithdraw}>탈퇴 확인</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── 토스트 ── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
