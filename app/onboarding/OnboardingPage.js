"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./onboarding.module.css";

const NICKNAME_SUGGESTIONS = [
  "법알못", "계약왕", "부동산초보", "알바지킴이",
  "프리랜서A", "청년세입자", "직장인B", "권리찾기",
];

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: 닉네임, 2: 알림설정, 3: 완료
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailLegal, setEmailLegal] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedNickname, setSavedNickname] = useState("");

  // 미로그인 → 홈으로
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 신규 유저 아닌 경우 → 마이페이지로
  useEffect(() => {
    if (status === "authenticated" && session?.user?.isNewUser === false) {
      router.replace("/mypage");
    }
    // 구글 이름을 기본 닉네임 제안으로
    if (session?.user?.name && !nickname) {
      const base = session.user.name.split(" ")[0];
      setNickname(base);
    }
  }, [status, session]);

  const validateNickname = (v) => {
    if (!v.trim()) return "닉네임을 입력해주세요.";
    if (v.trim().length < 1 || v.trim().length > 20) return "1~20자 사이로 입력해주세요.";
    if (!/^[\w\uAC00-\uD7A3\s-]+$/.test(v.trim())) return "한글, 영문, 숫자, 하이픈, 언더스코어만 사용 가능합니다.";
    return "";
  };

  const handleStep1Next = () => {
    const err = validateNickname(nickname);
    if (err) { setNicknameError(err); return; }
    setNicknameError("");
    setStep(2);
  };

  const handleComplete = async () => {
    if (!agreeTerms || !agreePrivacy) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname:        nickname.trim(),
          email_marketing: emailMarketing,
          email_legal:     emailLegal,
          is_new_user:     false,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      // 세션 갱신 (닉네임, isNewUser 반영)
      await update();
      setSavedNickname(nickname.trim());
      setStep(3);
    } catch (e) {
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>온변</span>
          <span className={styles.brandSub}>온라인 변호사</span>
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>

          {/* 진행 단계 표시 */}
          {step < 3 && (
            <div className={styles.progress}>
              {[1, 2].map(i => (
                <div key={i} className={styles.progressItem}>
                  <div className={`${styles.progressDot} ${step >= i ? styles.progressDotActive : ""} ${step > i ? styles.progressDotDone : ""}`}>
                    {step > i ? "✓" : i}
                  </div>
                  <span className={`${styles.progressLabel} ${step >= i ? styles.progressLabelActive : ""}`}>
                    {i === 1 ? "닉네임" : "알림 설정"}
                  </span>
                  {i < 2 && <div className={`${styles.progressLine} ${step > i ? styles.progressLineDone : ""}`} />}
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: 닉네임 */}
          {step === 1 && (
            <div className={styles.stepBody}>
              <div className={styles.welcome}>
                {session?.user?.image && (
                  <img src={session.user.image} alt="프로필" className={styles.avatar} />
                )}
                <div className={styles.welcomeText}>
                  <span className={styles.welcomeName}>{session?.user?.name?.split(" ")[0] || ""}님,</span>
                  <span className={styles.welcomeSub}>온변에 오신 것을 환영해요!</span>
                </div>
              </div>

              <h1 className={styles.stepTitle}>닉네임을 설정해주세요</h1>
              <p className={styles.stepDesc}>온변에서 사용할 이름입니다. 실명이 아니어도 됩니다.</p>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>닉네임 <span className={styles.required}>*</span></label>
                <div className={styles.inputWrap}>
                  <input
                    className={`${styles.input} ${nicknameError ? styles.inputError : ""}`}
                    type="text"
                    placeholder="닉네임을 입력하세요 (1~20자)"
                    value={nickname}
                    maxLength={20}
                    onChange={e => { setNickname(e.target.value); setNicknameError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleStep1Next()}
                    autoFocus
                  />
                  <span className={styles.charCount}>{nickname.length}/20</span>
                </div>
                {nicknameError && <div className={styles.errorMsg}>{nicknameError}</div>}
              </div>

              <div className={styles.suggestions}>
                <span className={styles.suggestLabel}>추천 닉네임</span>
                <div className={styles.suggestRow}>
                  {NICKNAME_SUGGESTIONS.slice(0, 4).map(s => (
                    <button key={s} className={styles.suggestBtn} onClick={() => { setNickname(s); setNicknameError(""); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.nextBtn} onClick={handleStep1Next}>
                다음 →
              </button>
            </div>
          )}

          {/* STEP 2: 알림·약관 */}
          {step === 2 && (
            <div className={styles.stepBody}>
              <h1 className={styles.stepTitle}>알림 및 약관 설정</h1>
              <p className={styles.stepDesc}>받고 싶은 알림과 필수 동의 항목을 확인해주세요.</p>

              {/* 이메일 알림 */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionBlockTitle}>📬 이메일 알림</div>

                <label className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>법령 변경 알림</span>
                    <span className={styles.toggleDesc}>최저임금·임대차보호법 등 주요 법령 변경 시 이메일로 알려드려요.</span>
                  </div>
                  <div
                    className={`${styles.toggle} ${emailLegal ? styles.toggleOn : ""}`}
                    onClick={() => setEmailLegal(v => !v)}
                  >
                    <div className={styles.toggleThumb} />
                  </div>
                </label>

                <label className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>서비스 업데이트 알림 <span className={styles.optional}>(선택)</span></span>
                    <span className={styles.toggleDesc}>신규 기능, 이벤트, 혜택 소식을 이메일로 보내드려요.</span>
                  </div>
                  <div
                    className={`${styles.toggle} ${emailMarketing ? styles.toggleOn : ""}`}
                    onClick={() => setEmailMarketing(v => !v)}
                  >
                    <div className={styles.toggleThumb} />
                  </div>
                </label>
              </div>

              {/* 약관 동의 */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionBlockTitle}>📋 약관 동의</div>

                {/* 전체 동의 */}
                <label
                  className={`${styles.checkRow} ${styles.checkRowAll}`}
                  onClick={() => {
                    const next = !(agreeTerms && agreePrivacy);
                    setAgreeTerms(next);
                    setAgreePrivacy(next);
                  }}
                >
                  <div className={`${styles.checkbox} ${agreeTerms && agreePrivacy ? styles.checkboxOn : ""}`}>
                    {agreeTerms && agreePrivacy && "✓"}
                  </div>
                  <span className={styles.checkLabel}>전체 동의</span>
                </label>

                <div className={styles.checkDivider} />

                <label className={styles.checkRow} onClick={() => setAgreeTerms(v => !v)}>
                  <div className={`${styles.checkbox} ${agreeTerms ? styles.checkboxOn : ""}`}>
                    {agreeTerms && "✓"}
                  </div>
                  <span className={styles.checkLabel}>
                    <span className={styles.required}>[필수]</span> 서비스 이용약관 동의
                  </span>
                  <Link href="/terms" target="_blank" className={styles.checkLink} onClick={e => e.stopPropagation()}>
                    보기
                  </Link>
                </label>

                <label className={styles.checkRow} onClick={() => setAgreePrivacy(v => !v)}>
                  <div className={`${styles.checkbox} ${agreePrivacy ? styles.checkboxOn : ""}`}>
                    {agreePrivacy && "✓"}
                  </div>
                  <span className={styles.checkLabel}>
                    <span className={styles.required}>[필수]</span> 개인정보 처리방침 동의
                  </span>
                  <Link href="/privacy" target="_blank" className={styles.checkLink} onClick={e => e.stopPropagation()}>
                    보기
                  </Link>
                </label>
              </div>

              <div className={styles.btnRow}>
                <button className={styles.backBtn} onClick={() => setStep(1)}>← 이전</button>
                <button
                  className={`${styles.nextBtn} ${(!agreeTerms || !agreePrivacy) ? styles.nextBtnDisabled : ""}`}
                  onClick={handleComplete}
                  disabled={!agreeTerms || !agreePrivacy || loading}
                >
                  {loading ? "저장 중..." : "온변 시작하기 🎉"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 완료 */}
          {step === 3 && (
            <div className={styles.doneBody}>
              <div className={styles.doneIcon}>🎉</div>
              <h1 className={styles.doneTitle}>환영합니다, {savedNickname}님!</h1>
              <p className={styles.doneDesc}>
                온변에서 계약서 주의사항, 정부지원 서류,<br />
                AI 계약서 분석까지 무료로 이용하세요.
              </p>
              <div className={styles.doneFeatures}>
                <div className={styles.doneFeatureItem}><span>📋</span> 121종 계약서 체크리스트</div>
                <div className={styles.doneFeatureItem}><span>🧮</span> 주휴수당·전세가율 계산기</div>
                <div className={styles.doneFeatureItem}><span>🤖</span> AI 계약서 분석 (하루 1회 무료)</div>
              </div>
              <Link href="/" className={styles.startBtn}>
                온변 시작하기 →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
