"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CONTRACTS, APPLICATIONS, CONTRACT_CATEGORIES, CONTRACT_LIST } from "../data";
import { DOC_DETAILS } from "../doc-details";
import styles from "./OnByun.module.css";

const LEVEL_CONFIG = {
  danger: { label: "위험", bg: "#fff1f1", border: "#ffcccc", text: "#c00000", dot: "#e03535" },
  warn:   { label: "주의", bg: "#fffbee", border: "#ffe5a0", text: "#7a5000", dot: "#d08600" },
  info:   { label: "확인", bg: "#e8f3fd", border: "#b3d4f5", text: "#1e5fa8", dot: "#3C91E6" },
};

const TAG_COLORS = {
  blue:   { bg: "#e8f3fd", text: "#1e5fa8", border: "#b3d4f5" },
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

// 주로 사용하는 문서 (검색량 기준 — 계약서 위주)
const POPULAR_DOCS = [
  { id: "labor",              label: "근로계약서",           icon: "💼", type: "contract",     desc: "알바·직장 계약" },
  { id: "lease",              label: "임대차 계약서",         icon: "🏠", type: "contract",     desc: "전세·월세" },
  { id: "freelance",          label: "프리랜서 계약서",       icon: "💻", type: "contract",     desc: "외주·용역" },
  { id: "cert-deposit-return",label: "내용증명(보증금 반환)", icon: "📬", type: "list",         desc: "보증금 못 받을 때" },
  { id: "employment",         label: "취업·위촉 계약서",      icon: "📋", type: "contract",     desc: "정규직·위촉직" },
];

// 부동산 관련 문서
const REALESTATE_DOCS = [
  { id: "realestate-lease",   label: "임대차 계약서",         icon: "🏠", desc: "전세·월세 주의사항" },
  { id: "realestate-sale",    label: "부동산 매매 계약서",     icon: "🏢", desc: "매매 시 필수 확인" },
  { id: "realestate-permit",  label: "토지거래허가구역 서류",  icon: "📋", desc: "허가구역 거래 필요 서류" },
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
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [docOpenId, setDocOpenId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const [aiDragOver, setAiDragOver] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [aiHistory, setAiHistory] = useState([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [aiHistoryOpen, setAiHistoryOpen] = useState(true); // 기본 열림
  const [aiUsedCount, setAiUsedCount] = useState(null);
  // ── 북마크 (로컬스토리지) ──
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("onbyun_bookmarks") || "[]"); } catch { return []; }
  });
  const [bookmarkToast, setBookmarkToast] = useState(null); // { msg, id }
  // ── 공유 ──
  const [shareToast, setShareToast] = useState(false);
  // ── FAB 메뉴 ──
  const [fabOpen, setFabOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // ── 한글 금액 표기 헬퍼 ──
  const toKoreanAmount = (won) => {
    if (!won || isNaN(won)) return "";
    const n = Math.abs(Math.round(won));
    if (n === 0) return "0원";
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    const rest = n % 10000;
    let parts = [];
    if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
    if (man > 0) parts.push(`${man.toLocaleString()}만`);
    if (rest > 0 && eok === 0) parts.push(`${rest.toLocaleString()}`);
    return parts.join(" ") + "원";
  };
  // 만원 단위 입력 → 한글 표기
  const toKoreanManwon = (manwon) => {
    if (!manwon || isNaN(manwon)) return "";
    return toKoreanAmount(parseFloat(manwon) * 10000);
  };

  // ── 계산기 탭 state ──
  const [calcType, setCalcType] = useState("wage"); // wage | overtime | severance | jeonse | monthly | loan | ltv
  // 주휴수당
  const [wageHourly, setWageHourly] = useState("");
  const [wageHours, setWageHours] = useState("");
  // 주말/시간외 수당 (주휴수당 우측)
  const [otHourly, setOtHourly] = useState("");
  const [otWeekendHours, setOtWeekendHours] = useState("");
  const [otOvertimeHours, setOtOvertimeHours] = useState("");
  const [otNightHours, setOtNightHours] = useState("");
  // 퇴직금
  const [sevMonthly, setSevMonthly] = useState("");
  const [sevMonths, setSevMonths] = useState("");
  // 전세가율
  const [jeonseSale, setJeonseSale] = useState("");
  const [jeonseDeposit, setJeonseDeposit] = useState("");
  // 월세환산
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  // 대출 계산기 (월세전세 우측)
  const [loanAmount, setLoanAmount] = useState("");
  const [loanRate, setLoanRate] = useState("");
  const [loanYears, setLoanYears] = useState("");
  const [loanType, setLoanType] = useState("equal"); // equal | equalPrincipal | bullet
  // LTV/DTI/DSR
  const [ltvPrice, setLtvPrice] = useState("");
  const [ltvLoan, setLtvLoan] = useState("");
  const [dtiIncome, setDtiIncome] = useState("");
  const [dtiRepay, setDtiRepay] = useState("");
  const [dsrAllLoan, setDsrAllLoan] = useState("");
  const [dsrAllRate, setDsrAllRate] = useState("");
  const [dsrIncome, setDsrIncome] = useState("");
  // 중도상환수수료
  const [prepayBalance, setPrepayBalance] = useState("");
  const [prepayFeeRate, setPrepayFeeRate] = useState("");
  const [prepayHoldMonths, setPrepayHoldMonths] = useState("");
  const [prepayTotalMonths, setPrepayTotalMonths] = useState("");
  // 부동산 서브탭
  const [realSubTab, setRealSubTab] = useState("monthly"); // monthly | loan | ltv | prepay

  // ── 정부지원 퀵체커 state ──
  const [checkAge, setCheckAge] = useState("");
  const [checkIncome, setCheckIncome] = useState("");
  const [checkHouse, setCheckHouse] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checkDone, setCheckDone] = useState(false);

  const searchRef = useRef(null);

  // ── URL ?tab= 파라미터로 탭 직접 이동 (DocPage 헤더 링크 처리) ──
  useEffect(() => {
    const VALID_TABS = ["home", "list", "calc", "support", "ai", "contract", "application"];
    const tabParam = searchParams?.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);

  // ── 신규 유저 → 온보딩 자동 리다이렉트 ──
  useEffect(() => {
    if (isLoggedIn && session?.user?.isNewUser === true) {
      router.push("/onboarding");
    }
  }, [isLoggedIn, session?.user?.isNewUser]);

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
    setAiFile(null);
    setAiDragOver(false);
    setShowResults(false);
    setCheckDone(false);
    setCheckResult(null);
    setCheckAge("");
    setCheckIncome("");
    setCheckHouse("");
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

  // 불편사항 전송 → /api/feedback → Supabase feedback 테이블 저장
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: feedbackCategory || "기타",
          text: feedbackText.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackSent(true);
        setFeedbackText("");
        setFeedbackCategory("");
      } else {
        alert(json.message ?? "전송에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (e) {
      console.error("피드백 저장 오류:", e);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 파일 처리
  const handleAiFile = (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    const isImg = file.type.startsWith("image/");
    if (!isPdf && !isImg) { setAiError("PDF 또는 이미지 파일만 업로드할 수 있어요."); return; }
    if (file.size > 5 * 1024 * 1024) { setAiError("파일 크기가 5MB를 초과했어요."); return; }
    setAiError("");
    setAiFile({ file, type: isPdf ? "pdf" : "image", mimeType: file.type });
  };

  const handleAiDragEnter = (e) => { e.preventDefault(); setAiDragOver(true); };
  const handleAiDragOver = (e) => { e.preventDefault(); };
  const handleAiDragLeave = (e) => {
    // relatedTarget이 자식 요소가 아닐 때만 해제
    if (!e.currentTarget.contains(e.relatedTarget)) setAiDragOver(false);
  };
  const handleAiDrop = (e) => {
    e.preventDefault();
    setAiDragOver(false);
    handleAiFile(e.dataTransfer.files[0]);
  };

  // AI 분석
  // ── AI 분석 히스토리 조회 ──
  const fetchAiHistory = async () => {
    if (!isLoggedIn) return;
    setAiHistoryLoading(true);
    try {
      const res = await fetch("/api/history?page=1");
      const data = await res.json();
      if (res.ok) {
        setAiHistory(data.items || []);
        // 이번 달 사용 횟수 계산
        const thisMonth = new Date();
        thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
        const count = (data.items || []).filter(
          h => new Date(h.created_at) >= thisMonth
        ).length;
        setAiUsedCount(count);
      }
    } catch {}
    setAiHistoryLoading(false);
  };

  // AI 탭 진입 시 히스토리 자동 로드
  useEffect(() => {
    if (tab === "ai" && isLoggedIn) fetchAiHistory();
  }, [tab, isLoggedIn]);

  const handleAiAnalyze = async () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError("");
    try {
      let body;
      if (aiFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => reject(new Error("파일 읽기 실패"));
          reader.readAsDataURL(aiFile.file);
        });
        body = { fileData: base64, fileType: aiFile.type, mimeType: aiFile.mimeType };
      } else {
        body = { text: aiText.slice(0, 8000) };
      }
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.loginRequired) { setShowLogin(true); return; }
        setAiError(data.error || "분석 중 오류가 발생했습니다.");
        return;
      }
      setAiResult(data);
      // 분석 성공 후 히스토리·사용횟수 갱신
      fetchAiHistory();
    } catch {
      setAiError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  // showPrivacy, showTerms — /privacy, /terms 페이지로 이동됨 (미사용 state 유지는 빌드 에러 방지용)

  // ── 북마크 토글 ──
  const toggleBookmark = (item) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === item.id);
      let next;
      if (exists) {
        next = prev.filter(b => b.id !== item.id);
        setBookmarkToast({ msg: "북마크 제거됨", id: item.id });
      } else {
        next = [...prev, { id: item.id, label: item.label, type: item.type || "list", savedAt: Date.now() }];
        setBookmarkToast({ msg: "북마크 저장됨 📌", id: item.id });
      }
      if (typeof window !== "undefined") localStorage.setItem("onbyun_bookmarks", JSON.stringify(next));
      setTimeout(() => setBookmarkToast(null), 2000);
      return next;
    });
  };
  const isBookmarked = (id) => bookmarks.some(b => b.id === id);

  // ── 분석 결과 공유 ──
  const handleShare = async () => {
    if (!aiResult) return;
    const text = `[온변 AI 분석 결과]\n${aiResult.type} — ${aiResult.summary}\n\nhttps://onbyun.vercel.app`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "온변 계약서 분석 결과", text, url: "https://onbyun.vercel.app" }); return; }
      catch {}
    }
    // Web Share API 미지원 → 클립보드 복사
    try {
      await navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    } catch {}
  };

  // ── FAB 파일 선택 ──
  const fabFileRef = useRef(null);       // 계약서 사진 (카메라)
  const fabOcrRef  = useRef(null);       // 텍스트 OCR (카메라)
  const handleFabCamera = () => {
    setFabOpen(false);
    fabFileRef.current?.click();
  };
  const handleFabOcr = () => {
    setFabOpen(false);
    fabOcrRef.current?.click();
  };

  // ── 주휴수당 계산 ──
  const calcWage = () => {
    const h = parseFloat(wageHourly);
    const w = parseFloat(wageHours);
    if (!h || !w || w <= 0) return null;
    if (w < 15) return { result: 0, note: "주 15시간 미만은 주휴수당 미발생" };
    const weekly = Math.round((w / 40) * 8 * h);
    const monthly = Math.round(weekly * 4.345);
    return { result: weekly, monthly, note: `주 ${w}시간 × 시급 ${h.toLocaleString()}원` };
  };

  // ── 시간외·주말 수당 계산 ──
  const calcOvertime = () => {
    const h = parseFloat(otHourly);
    if (!h) return null;
    const weekend = parseFloat(otWeekendHours) || 0;
    const overtime = parseFloat(otOvertimeHours) || 0;
    const night = parseFloat(otNightHours) || 0;
    const weekendPay = Math.round(weekend * h * 1.5);
    const overtimePay = Math.round(overtime * h * 1.5);
    const nightPay = Math.round(night * h * 0.5);
    const total = weekendPay + overtimePay + nightPay;
    return { weekendPay, overtimePay, nightPay, total };
  };

  // ── 퇴직금 계산 ──
  const calcSev = () => {
    const m = parseFloat(sevMonthly);
    const months = parseFloat(sevMonths);
    if (!m || !months || months < 12) return null;
    const years = months / 12;
    return { result: Math.round(m * years), note: `${months}개월 근무 기준` };
  };

  // ── 전세가율 계산 ──
  const calcJeonse = () => {
    const sale = parseFloat(jeonseSale.replace(/,/g, ""));
    const dep = parseFloat(jeonseDeposit.replace(/,/g, ""));
    if (!sale || !dep || sale <= 0) return null;
    const ratio = Math.round((dep / sale) * 100);
    let level = "safe", label = "안전", desc = "전세가율이 적정 수준입니다.";
    if (ratio >= 80) { level = "danger"; label = "위험"; desc = "깡통전세 위험이 높습니다. 전세보증보험 필수 가입을 권장합니다."; }
    else if (ratio >= 70) { level = "warn"; label = "주의"; desc = "전세가율이 높은 편입니다. 전세보증보험 가입을 검토하세요."; }
    return { ratio, level, label, desc };
  };

  // ── 월세↔전세 환산 ──
  const calcMonthly = () => {
    const dep = parseFloat(monthlyDeposit.replace(/,/g, ""));
    const rent = parseFloat(monthlyRent.replace(/,/g, ""));
    if (!dep || !rent) return null;
    const rate = 0.04;
    const jeonse = Math.round(dep + (rent * 12) / rate);
    const annualRent = rent * 12;
    return { jeonse, annualRent };
  };

  // ── 대출 월상환액 계산 ──
  const calcLoan = () => {
    const principal = parseFloat(loanAmount) * 10000;
    const annualRate = parseFloat(loanRate) / 100;
    const months = parseFloat(loanYears) * 12;
    if (!principal || !annualRate || !months) return null;
    const monthlyRate = annualRate / 12;
    let monthly, totalInterest;
    if (loanType === "equal") {
      monthly = Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1));
      totalInterest = Math.round(monthly * months - principal);
    } else if (loanType === "equalPrincipal") {
      const pMonthly = Math.round(principal / months);
      const fInterest = Math.round(principal * monthlyRate);
      monthly = pMonthly + fInterest;
      totalInterest = Math.round(principal * monthlyRate * (months + 1) / 2);
    } else {
      monthly = Math.round(principal * monthlyRate);
      totalInterest = Math.round(monthly * months);
    }
    return { monthly, totalInterest, totalRepay: Math.round(principal + totalInterest), principal };
  };

  // ── LTV 계산 ──
  const calcLtv = () => {
    const price = parseFloat(ltvPrice) * 10000;
    const loan = parseFloat(ltvLoan) * 10000;
    if (!price || !loan) return null;
    const ltv = Math.round((loan / price) * 1000) / 10;
    const ltvLevel = ltv <= 60 ? "safe" : ltv <= 80 ? "warn" : "danger";
    return { ltv, ltvLevel };
  };

  // ── DTI 계산 ──
  const calcDti = () => {
    const income = parseFloat(dtiIncome) * 10000;
    const monthlyRepay = parseFloat(dtiRepay) * 10000; // 월간 원리금
    if (!income || !monthlyRepay) return null;
    const annualRepay = monthlyRepay * 12; // 연간으로 환산
    const dti = Math.round((annualRepay / income) * 1000) / 10;
    return { dti, level: dti <= 40 ? "safe" : dti <= 60 ? "warn" : "danger", annualRepay };
  };

  // ── DSR 계산 ──
  const calcDsr = () => {
    const income = parseFloat(dsrIncome) * 10000;
    const allLoanAmt = parseFloat(dsrAllLoan) * 10000;
    const rate = parseFloat(dsrAllRate) / 100;
    if (!income || !allLoanAmt || !rate) return null;
    const mr = rate / 12;
    const n = 30 * 12;
    const annualRepay = Math.round(allLoanAmt * mr * Math.pow(1+mr,n) / (Math.pow(1+mr,n)-1)) * 12;
    const dsr = Math.round((annualRepay / income) * 1000) / 10;
    return { dsr, level: dsr <= 40 ? "safe" : dsr <= 60 ? "warn" : "danger", annualRepay };
  };

  // ── 중도상환수수료 계산 ──
  const calcPrepay = () => {
    const balance = parseFloat(prepayBalance) * 10000;
    const feeRate = parseFloat(prepayFeeRate) / 100;
    const hold = parseFloat(prepayHoldMonths);
    const total = parseFloat(prepayTotalMonths);
    if (!balance || !feeRate || !hold || !total || hold >= total) return null;
    const remain = total - hold;
    const ratio = remain / total;
    return { fee: Math.round(balance * feeRate * ratio), ratio: Math.round(ratio * 100) };
  };

  // ── 정부지원 퀵체커 ──
  const GOV_SUPPORTS = [
    {
      id: "monthly-rent",
      name: "청년 월세 지원",
      desc: "월 최대 20만원, 최대 12개월 지원",
      link: "https://youth.myhome.go.kr",
      cond: (age, income, house) => age >= 19 && age <= 34 && income <= 5 && house === "renter",
    },
    {
      id: "youth-loan",
      name: "청년 버팀목 전세대출",
      desc: "연 2.1~2.9% 저금리 전세자금 대출",
      link: "https://nhuf.molit.go.kr",
      cond: (age, income, house) => age >= 19 && age <= 34 && income <= 5 && house === "renter",
    },
    {
      id: "youth-dooryak",
      name: "청년도약계좌",
      desc: "월 최대 70만원 납입, 정부 기여금 + 비과세",
      link: "https://www.kinfa.or.kr",
      cond: (age, income) => age >= 19 && age <= 34 && income >= 1 && income <= 7,
    },
    {
      id: "hatssal",
      name: "햇살론 유스",
      desc: "저신용·저소득 청년 대상 연 3.5% 저금리 대출",
      link: "https://www.kinfa.or.kr",
      cond: (age, income) => age >= 19 && age <= 34 && income <= 3,
    },
    {
      id: "house-support",
      name: "청년 주택드림 청약통장",
      desc: "소득공제 + 우대금리 청약 통장",
      link: "https://nhuf.molit.go.kr",
      cond: (age, income) => age >= 19 && age <= 34 && income <= 5,
    },
    {
      id: "basic-pension",
      name: "기초연금",
      desc: "월 최대 33만 4,810원 지급 (2025년 기준)",
      link: "https://basicpension.mohw.go.kr",
      cond: (age, income) => age >= 65 && income <= 7,
    },
    {
      id: "housing-benefit",
      name: "주거급여",
      desc: "임차가구 월세 지원 또는 자가가구 수선비 지원",
      link: "https://www.hb.go.kr",
      cond: (age, income) => income <= 5,
    },
    {
      id: "edu-benefit",
      name: "교육급여",
      desc: "초·중·고 학생 교육활동지원비 지급 (연 최대 65.4만원)",
      link: "https://www.bokjiro.go.kr",
      cond: (age, income) => income <= 3,
    },
    {
      id: "child-allowance",
      name: "아동수당",
      desc: "만 8세 미만 아동 월 10만원 지급",
      link: "https://www.childallowance.go.kr",
      cond: (age) => age < 9,
    },
    {
      id: "unemployment",
      name: "실업급여",
      desc: "퇴직 전 임금의 60%, 최소 90일 지급",
      link: "https://www.ei.go.kr",
      cond: (age, income) => income >= 1,
    },
    {
      id: "health-check",
      name: "국가 건강검진",
      desc: "2년마다 무료 건강검진 (짝수·홀수년 생)",
      link: "https://www.nhis.or.kr",
      cond: () => true,
    },
  ];

  const runSupportCheck = () => {
    const age = parseInt(checkAge);
    const income = parseInt(checkIncome);
    const house = checkHouse;
    if (!age || !income || !house) return;
    const matched = GOV_SUPPORTS.filter(s => s.cond(age, income, house));
    setCheckResult(matched);
    setCheckDone(true);
  };

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
    contract:    { bg: "#e8f3fd", text: "#1e5fa8" },
    application: { bg: "#f5f5f5", text: "#555555" },
    list:        { bg: "#f5f5f5", text: "#555555" },
  };

  return (
    <div
      className={styles.page}
    >
      {/* ─── 헤더 ─── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand} style={{ cursor: "pointer" }} onClick={() => handleTabChange("home")}>
            <span className={styles.brandMark}>온변</span>
            <span className={styles.brandFull}>온라인 변호사</span>
          </div>
          <nav className={styles.nav}>
            <button className={`${styles.navBtn} ${tab === "home" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("home")}>홈</button>
            <button className={`${styles.navBtn} ${tab === "list" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("list")}>전체 문서</button>
            <button className={`${styles.navBtn} ${tab === "calc" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("calc")}>계산기</button>
            <button className={`${styles.navBtn} ${tab === "support" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("support")}>정부지원</button>
            <button className={`${styles.navBtn} ${tab === "ai" ? styles.navBtnActive : ""}`} onClick={() => handleTabChange("ai")}>
              <span className={styles.navBtnNew}>AI 분석 <span className={styles.newBadge}>NEW</span></span>
            </button>
          </nav>
          {/* 로그인 버튼 — 데스크탑/모바일 공통 */}
          <button className={styles.loginBtn} onClick={() => {
            if (isLoggedIn) { router.push("/mypage"); }
            else { setShowLogin(true); }
          }}>
            {isLoggedIn ? (session.user.nickname || session.user.name?.split(" ")[0] || "내 계정") : "로그인"}
          </button>
        </div>
      </header>

      {/* ─── 로그인 모달 ─── */}
      {showLogin && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <button className={styles.modalClose} onClick={() => setShowLogin(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalWelcome}>
                <div className={styles.modalLogo}>온변</div>
                <div className={styles.modalWelcomeText}>Google 계정으로 시작하세요</div>
                <div className={styles.modalWelcomeSub}>AI 계약서 분석을 하루 1회 무료로 이용할 수 있어요</div>
              </div>
              <button className={styles.googleBtn} onClick={() => { setShowLogin(false); signIn("google", { callbackUrl: "/app-service" }); }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Google로 계속하기
              </button>
              <p className={styles.modalLegalNote}>로그인 시 <Link href="/terms" className={styles.textLink} target="_blank">이용약관</Link> 및 <Link href="/privacy" className={styles.textLink} target="_blank">개인정보처리방침</Link>에 동의합니다.</p>
            </div>
          </div>
        </div>
      )}

      <main className={styles.main}>

        {/* ─── 홈 탭 ─── */}
        {tab === "home" && (
          <>
            {/* ── 히어로: 검색창 중앙 배치 ── */}
            <section className={styles.heroCenter}>
              <div className={styles.heroCenterBadge}>무료 법률 정보 서비스</div>
              <h1 className={styles.heroCenterTitle}>이 계약,<br />서명해도 될까요?</h1>
              <p className={styles.heroCenterDesc}>법률 용어 없이, 10초 만에 확인</p>

              {/* 통합 검색 — 히어로 중앙 */}
              <div className={styles.heroSearchWrap} ref={searchRef}>
                <div className={styles.heroSearchBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    className={styles.heroSearchInput}
                    type="text"
                    placeholder="근로계약서, 전세계약서, 내용증명..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    autoComplete="off"
                  />
                  {search && <button className={styles.searchClear} onClick={() => { setSearch(""); setShowResults(false); }}>✕</button>}
                </div>

                {/* 검색 결과 드롭다운 */}
                {showResults && searchResults.length > 0 && (
                  <div className={styles.searchDropdown}>
                    {searchResults.map(item => {
                      const tc = typeColor[item.type];
                      return (
                        <Link key={`${item.type}-${item.id}`} href={`/doc/${item.id}`} className={styles.searchResultItem} onClick={() => setShowResults(false)}>
                          <span className={styles.searchResultIcon}>{item.icon}</span>
                          <div className={styles.searchResultInfo}>
                            <div className={styles.searchResultLabel}>{item.label}</div>
                            {item.summary && <div className={styles.searchResultSub}>{item.summary}</div>}
                          </div>
                          <span className={styles.searchResultType} style={{ background: tc.bg, color: tc.text }}>{typeLabel[item.type]}</span>
                        </Link>
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

              {/* 통계 */}
              <div className={styles.heroStats}>
                <div className={styles.heroStat}><strong>121종</strong> 법률 문서</div>
                <div className={styles.heroStatDivider} />
                <div className={styles.heroStat}><strong>무료</strong> 기본 서비스</div>
                <div className={styles.heroStatDivider} />
                <div className={styles.heroStat}><strong>AI</strong> 계약서 분석</div>
              </div>
            </section>


            {/* ── 자주 찾는 계약서 ── */}
            <div className={styles.quickSection}>
              <div className={styles.quickSectionTitle}>자주 찾는 계약서</div>
              <div className={styles.popularGrid}>
                {POPULAR_DOCS.map(doc => (
                  <Link key={doc.id} href={`/doc/${doc.id}`} className={styles.popularCard}>
                    <span className={styles.popularIcon}>{doc.icon}</span>
                    <div className={styles.popularLabel}>{doc.label}</div>
                    <div className={styles.popularDesc}>{doc.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── 부동산 관련 문서 ── */}
            <div className={styles.quickSection}>
              <div className={styles.quickSectionTitle}>부동산 관련 문서</div>
              <div className={styles.popularGrid}>
                {REALESTATE_DOCS.map(doc => (
                  <Link key={doc.id} href={`/doc/${doc.id}`} className={styles.popularCard}>
                    <span className={styles.popularIcon}>{doc.icon}</span>
                    <div className={styles.popularLabel}>{doc.label}</div>
                    <div className={styles.popularDesc}>{doc.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── 정부지원 신청 서류 ── */}
            <div className={styles.quickSection}>
              <div className={styles.quickSectionTitle}>정부지원 신청 서류도 확인하세요</div>
              <div className={styles.popularGrid}>
                {APPLICATIONS.map(app => (
                  <Link key={app.id} href={`/doc/${app.id}`} className={styles.popularCard}>
                    <span className={styles.popularIcon}>{app.icon}</span>
                    <div className={styles.popularLabel}>{app.label}</div>
                    <div className={styles.popularDesc}>{app.summary}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── 계산기 미리보기 위젯 ── */}
            <div className={styles.calcPreviewSection}>
              <div className={styles.calcPreviewHeader}>
                <div className={styles.quickSectionTitle}>🧮 바로 계산해보세요</div>
                <button className={styles.calcPreviewMore} onClick={() => handleTabChange("calc")}>전체 계산기 →</button>
              </div>
              <div className={styles.calcPreviewGrid}>
                {/* 주휴수당 미니 계산기 */}
                <div className={styles.calcPreviewCard}>
                  <div className={styles.calcPreviewCardTitle}>주휴수당 계산기</div>
                  <div className={styles.calcPreviewCardDesc}>주 15시간 이상 근무 시 발생</div>
                  <div className={styles.calcMiniRow}>
                    <label className={styles.calcMiniLabel}>시급 (원)</label>
                    <input className={styles.calcMiniInput} type="number" placeholder="10,030" value={wageHourly} onChange={e => setWageHourly(e.target.value)} />
                  </div>
                  <div className={styles.calcMiniRow}>
                    <label className={styles.calcMiniLabel}>주 근무시간</label>
                    <input className={styles.calcMiniInput} type="number" placeholder="20" value={wageHours} onChange={e => setWageHours(e.target.value)} />
                  </div>
                  {calcWage() !== null && (
                    <div className={styles.calcMiniResult}>
                      {calcWage().result === 0
                        ? <span className={styles.calcMiniNote}>{calcWage().note}</span>
                        : <><span className={styles.calcMiniAmount}>{calcWage().result.toLocaleString()}원</span><span className={styles.calcMiniNote}>/주 · 월 약 {calcWage().monthly?.toLocaleString()}원</span></>
                      }
                    </div>
                  )}
                </div>

                {/* 전세가율 미니 계산기 */}
                <div className={styles.calcPreviewCard}>
                  <div className={styles.calcPreviewCardTitle}>전세가율 위험도</div>
                  <div className={styles.calcPreviewCardDesc}>70% 이상이면 주의 필요</div>
                  <div className={styles.calcMiniRow}>
                    <label className={styles.calcMiniLabel}>매매가 (만원)</label>
                    <input className={styles.calcMiniInput} type="number" placeholder="30000" value={jeonseSale} onChange={e => setJeonseSale(e.target.value)} />
                    {jeonseSale && <div className={styles.calcMiniHint}>{toKoreanManwon(jeonseSale)}</div>}
                  </div>
                  <div className={styles.calcMiniRow}>
                    <label className={styles.calcMiniLabel}>전세보증금 (만원)</label>
                    <input className={styles.calcMiniInput} type="number" placeholder="22000" value={jeonseDeposit} onChange={e => setJeonseDeposit(e.target.value)} />
                    {jeonseDeposit && <div className={styles.calcMiniHint}>{toKoreanManwon(jeonseDeposit)}</div>}
                  </div>
                  {calcJeonse() !== null && (() => {
                    const j = calcJeonse();
                    const colors = { safe: { bg: "#edf7ef", text: "#276b3a", border: "#b7dfc0" }, warn: { bg: "#fff8e8", text: "#7a5000", border: "#f0d68a" }, danger: { bg: "#fff1f1", text: "#c00000", border: "#ffcccc" } };
                    const c = colors[j.level];
                    return (
                      <div className={styles.calcMiniResult} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "8px 12px" }}>
                        <span className={styles.calcMiniAmount} style={{ color: c.text }}>{j.ratio}% — {j.label}</span>
                        <span className={styles.calcMiniNote} style={{ color: c.text, opacity: 0.85 }}>{j.desc}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ── 북마크 섹션 (저장된 항목이 있을 때만) ── */}
            {bookmarks.length > 0 && (
              <div className={styles.quickSection} style={{ marginBottom: 20 }}>
                <div className={styles.quickSectionTitle}>📌 내 북마크 <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>({bookmarks.length})</span></div>
                <div className={styles.bookmarkGrid}>
                  {bookmarks.slice(0, 6).map(b => (
                    <div key={b.id} className={styles.bookmarkItem}>
                      <Link href={`/doc/${b.id}`} className={styles.bookmarkItemLink}>{b.label}</Link>
                      <button className={styles.bookmarkRemove} onClick={() => toggleBookmark(b)} aria-label="북마크 제거">✕</button>
                    </div>
                  ))}
                </div>
                {bookmarks.length > 6 && (
                  <button className={styles.bookmarkMore} onClick={() => handleTabChange("list")}>전체 {bookmarks.length}개 보기 →</button>
                )}
              </div>
            )}

            {/* ── AI 예고 배너 ── */}
            <div className={styles.aiBanner}>
              <div className={styles.aiBannerInner}>
                <div>
                  <div className={styles.aiBannerTitle}>🤖 AI 계약서 분석 — 지금 바로 사용 가능</div>
                  <div className={styles.aiBannerDesc}>PDF 업로드 → 위험 조항 즉시 파악. 10초 안에 결과를 받아보세요.</div>
                </div>
                <button className={styles.aiBannerBtn} onClick={() => handleTabChange("ai")}>분석 시작하기 →</button>
              </div>
            </div>

            {/* ── 요금제 ── */}
            <section className={styles.pricingSection}>
              <div className={styles.pricingHeader}>
                <div className={styles.heroBadge}>요금제</div>
                <h2 className={styles.pricingTitle}>필요한 만큼만 사용하세요</h2>
                <p className={styles.pricingDesc}>기본 정보는 영원히 무료. AI 분석이 필요할 때 구독하세요.</p>
              </div>
              <div className={styles.pricingGrid}>
                <div className={styles.pricingCard}>
                  <div className={styles.pricingPlanName}>무료</div>
                  <div className={styles.pricingPrice}><span className={styles.pricingAmount}>0</span><span className={styles.pricingUnit}>원</span></div>
                  <div className={styles.pricingPriceNote}>영구 무료</div>
                  <ul className={styles.pricingFeatures}>
                    <li className={styles.pricingFeatureOn}>✓ 121종 계약서 체크리스트</li>
                    <li className={styles.pricingFeatureOn}>✓ 신청 서류 안내</li>
                    <li className={styles.pricingFeatureOn}>✓ AI 분석 하루 1회</li>
                    <li className={styles.pricingFeatureOff}>✗ 분석 내역 저장</li>
                    <li className={styles.pricingFeatureOff}>✗ 무제한 AI 분석</li>
                  </ul>
                  <button className={styles.pricingBtnOutline} disabled>무료로 시작하기</button>
                </div>
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
                  <button className={styles.pricingBtnFilled} disabled>준비 중</button>
                </div>
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
                  <button className={styles.pricingBtnOutline} disabled>준비 중</button>
                </div>
              </div>
            </section>

            {/* ─── 불편사항 접수 ─── */}
            <section className={styles.feedbackSection}>
              <div className={styles.feedbackHeader}>
                <div className={styles.heroBadge}>불편사항 접수</div>
                <h2 className={styles.feedbackTitle}>불편하셨나요?</h2>
                <p className={styles.feedbackDesc}>서비스 개선에 직접 반영됩니다. 편하게 적어주세요.</p>
              </div>
              {feedbackSent ? (
                <div className={styles.feedbackSuccess}>
                  <div className={styles.feedbackSuccessIcon}>✓</div>
                  <div className={styles.feedbackSuccessTitle}>소중한 의견 감사해요!</div>
                  <div className={styles.feedbackSuccessDesc}>접수된 내용을 확인하고 빠르게 반영할게요.</div>
                  <button className={styles.feedbackResetBtn} onClick={() => setFeedbackSent(false)}>다른 의견 보내기</button>
                </div>
              ) : (
                <div className={styles.feedbackCard}>
                  <div className={styles.feedbackCategoryRow}>
                    {["정보 오류", "기능 오작동", "UI/UX 불편", "콘텐츠 요청", "기타"].map(cat => (
                      <button key={cat}
                        className={`${styles.feedbackCatBtn} ${feedbackCategory === cat ? styles.feedbackCatBtnActive : ""}`}
                        onClick={() => setFeedbackCategory(prev => prev === cat ? "" : cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={styles.feedbackTextarea}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder={"불편하셨던 점이나 개선됐으면 하는 내용을 자유롭게 적어주세요.\n예) '근로계약서 주의사항에 00 내용이 빠진 것 같아요'"}
                    rows={5}
                  />
                  <div className={styles.feedbackFootRow}>
                    <span className={styles.feedbackCharCount}>{feedbackText.length} / 500자</span>
                    <button
                      className={styles.feedbackSubmitBtn}
                      onClick={handleFeedbackSubmit}
                      disabled={!feedbackText.trim() || feedbackLoading}>
                      {feedbackLoading ? "전송 중..." : "전송하기"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* ─── 계약서 탭 ─── */}
        {tab === "contract" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>계약서 주의사항</div>
              <h1 className={styles.heroTitle}>서명 전,<br />꼭 확인하세요</h1>
              <p className={styles.heroDesc}>위험 조항을 사전에 파악하고 불리한 계약을 피하세요.</p>
            </section>
            <div className={styles.grid}>
              {CONTRACTS.map(item => {
                const tc = TAG_COLORS[item.tagColor] || TAG_COLORS.blue;
                const isOpen = selectedId === item.id;
                return (
                  <div key={item.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
                    <button className={styles.cardBtn} onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}>
                      <div className={styles.cardTop}>
                        <span className={styles.cardIcon}>{item.icon}</span>
                        <span className={styles.cardTag} style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{item.tag}</span>
                      </div>
                      <div className={styles.cardLabel}>{item.label}</div>
                      <div className={styles.cardSummary}>{item.summary}</div>
                      <div className={styles.cardArrow}>{isOpen ? "▲ 접기" : "▼ 체크리스트 보기"}</div>
                    </button>
                    {isOpen && (
                      <div className={styles.detail}>
                        <div className={styles.divider} />
                        <div className={styles.detailSection}>
                          <div className={styles.detailTitle}>체크리스트</div>
                          <div className={styles.checkList}>{renderChecklist(item.checklist)}</div>
                        </div>
                        <div className={styles.detailSection}>
                          <div className={styles.detailTitle}>실전 팁</div>
                          <ul className={styles.tipList}>{item.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                        </div>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>{item.linkLabel} →</a>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── 신청서류 탭 ─── */}
        {tab === "application" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>정부지원 신청 서류</div>
              <h1 className={styles.heroTitle}>신청 전에<br />서류 먼저 확인하세요</h1>
              <p className={styles.heroDesc}>청년월세지원, 정책대출, 실업급여 등 필요한 서류를 정리했어요.</p>
            </section>
            <div className={styles.grid}>
              {APPLICATIONS.map(item => {
                const tc = TAG_COLORS[item.tagColor] || TAG_COLORS.blue;
                const isOpen = selectedId === item.id;
                return (
                  <div key={item.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
                    <button className={styles.cardBtn} onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}>
                      <div className={styles.cardTop}>
                        <span className={styles.cardIcon}>{item.icon}</span>
                        <span className={styles.cardTag} style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{item.tag}</span>
                      </div>
                      <div className={styles.cardLabel}>{item.label}</div>
                      <div className={styles.cardSummary}>{item.summary}</div>
                      {item.condition && <div className={styles.condition}>✓ {item.condition}</div>}
                      <div className={styles.cardArrow}>{isOpen ? "▲ 접기" : "▼ 서류 확인하기"}</div>
                    </button>
                    {isOpen && (
                      <div className={styles.detail}>
                        <div className={styles.divider} />
                        <div className={styles.freshnessWarn}>⚠️ 정부 정책은 수시로 변경됩니다. 신청 전 반드시 공식 사이트에서 최신 내용을 확인하세요.</div>
                        <div className={styles.detailSection}>
                          <div className={styles.detailTitle}>필요 서류</div>
                          {item.docs.map((d, i) => (
                            <div key={i} className={styles.docGroup}>
                              <div className={styles.docCategory}>{d.category}</div>
                              <ul className={styles.docList}>{d.items.map((doc, j) => <li key={j} className={styles.docItem}><span className={styles.docBullet}>·</span>{doc}</li>)}</ul>
                            </div>
                          ))}
                        </div>
                        <div className={styles.detailSection}>
                          <div className={styles.detailTitle}>주의사항</div>
                          <ul className={styles.tipList}>{item.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>{item.linkLabel} →</a>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {tab === "list" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>전체 문서 목록</div>
              <h1 className={styles.heroTitle}>필요한 문서를<br />빠르게 찾아보세요</h1>
              <p className={styles.heroDesc}>121종 이상의 법률 문서 주의사항을 제공합니다.</p>
            </section>

            {/* 검색창 */}
            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input className={styles.searchInput} type="text" placeholder="문서명으로 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>}
              </div>
            </div>

            {/* 카테고리 — 데스크탑 */}
            <div className={styles.catRow}>
              <button className={`${styles.catBtn} ${activeCategory === "all" ? styles.catBtnActive : ""}`} onClick={() => setActiveCategory("all")}>전체 ({CONTRACT_LIST.length})</button>
              {CONTRACT_CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.catBtnActive : ""}`}
                  onClick={() => { setActiveCategory(c.id); setDocOpenId(null); }}>
                  {c.label} ({CONTRACT_LIST.filter(i => i.category === c.id).length})
                </button>
              ))}
            </div>

            {/* 카테고리 — 모바일 가로스크롤 */}
            <div className={styles.catRowMobile}>
              <button className={`${styles.catBtn} ${activeCategory === "all" ? styles.catBtnActive : ""}`} onClick={() => setActiveCategory("all")}>
                전체 <span className={styles.catCount}>{filteredList.length}</span>
              </button>
              {CONTRACT_CATEGORIES.map(c => (
                <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.catBtnActive : ""}`}
                  onClick={() => { setActiveCategory(c.id); setDocOpenId(null); }}>
                  {c.label} <span className={styles.catCount}>{CONTRACT_LIST.filter(i => i.category === c.id).length}</span>
                </button>
              ))}
            </div>

            {/* 검색 결과 카운트 (모바일) */}
            {search && (
              <div className={styles.listSearchResult}>
                <span>"{search}" 검색 결과 <strong>{filteredList.length}건</strong></span>
                <button className={styles.listSearchClear} onClick={() => setSearch("")}>초기화</button>
              </div>
            )}

            {/* ── 데스크탑: 그리드 ── */}
            <div className={styles.docGrid}>
              {filteredList.map(item => {
                const cat = CONTRACT_CATEGORIES.find(c => c.id === item.category);
                const bm = isBookmarked(item.id);
                return (
                  <div key={item.id} className={styles.docCardWrap}>
                    <Link href={`/doc/${item.id}`} className={styles.docCard}>
                      <div className={styles.docCardTop}>
                        <div>
                          <div className={styles.docCardLabel}>{item.label}</div>
                          {cat && <div className={styles.docCardCat}>{cat.label}</div>}
                        </div>
                        <span className={styles.docCardArrowRight}>→</span>
                      </div>
                    </Link>
                    <button
                      className={`${styles.docCardBookmark} ${bm ? styles.docCardBookmarkOn : ""}`}
                      onClick={e => { e.preventDefault(); toggleBookmark({ id: item.id, label: item.label, type: "list" }); }}
                      aria-label={bm ? "북마크 제거" : "북마크 추가"}
                    >
                      {bm ? "🔖" : "☆"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── 모바일: 리스트 ── */}
            <div className={styles.mobileList}>
              {filteredList.length === 0 ? (
                <div className={styles.mobileListEmpty}>
                  <div className={styles.mobileListEmptyIcon}>🔍</div>
                  <div className={styles.mobileListEmptyText}>
                    {search ? `"${search}"에 해당하는 문서가 없어요` : "해당하는 문서가 없어요"}
                  </div>
                  {search && (
                    <button className={styles.mobileListEmptyBtn} onClick={() => setSearch("")}>검색 초기화</button>
                  )}
                </div>
              ) : (
                filteredList.map(item => {
                  const cat = CONTRACT_CATEGORIES.find(c => c.id === item.category);
                  const bm = isBookmarked(item.id);
                  return (
                    <div key={item.id} className={styles.mobileListItem}>
                      <Link href={`/doc/${item.id}`} className={styles.mobileListLink}>
                        <div className={styles.mobileListLeft}>
                          <div className={styles.mobileListLabel}>{item.label}</div>
                          {cat && <div className={styles.mobileListMeta}>{cat.label}</div>}
                        </div>
                        <span className={styles.mobileListArrow}>›</span>
                      </Link>
                      <button
                        className={`${styles.mobileListBm} ${bm ? styles.mobileListBmOn : ""}`}
                        onClick={() => toggleBookmark({ id: item.id, label: item.label, type: "list" })}
                        aria-label={bm ? "북마크 제거" : "북마크 추가"}
                      >
                        {bm ? "🔖" : "☆"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {filteredList.length === 0 && !search && <div className={styles.empty}>검색 결과가 없어요.</div>}
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
                <div className={styles.aiCardHeader}>
                  <div className={styles.aiCardLabel}>계약서 내용 입력</div>
                  {isLoggedIn && session?.user?.plan === "free" && aiUsedCount !== null && (
                    <div className={`${styles.aiUsageBadge} ${aiUsedCount >= 1 ? styles.aiUsageBadgeFull : ""}`}>
                      이번 달 {aiUsedCount} / 1회 무료
                      {aiUsedCount >= 1 && <span className={styles.aiUsageFull}> · 소진</span>}
                    </div>
                  )}
                </div>

                {/* ── 통합 입력 존 ── */}
                <div
                  className={`${styles.aiInputZone} ${aiDragOver ? styles.aiInputZoneDrag : ""} ${aiFile ? styles.aiInputZoneFile : ""}`}
                  onDragEnter={handleAiDragEnter}
                  onDragOver={handleAiDragOver}
                  onDragLeave={handleAiDragLeave}
                  onDrop={handleAiDrop}
                >
                  {/* 드래그 오버레이 */}
                  {aiDragOver && (
                    <div className={styles.aiDragOverlay}>
                      <span className={styles.aiDragIcon}>📂</span>
                      <span className={styles.aiDragText}>여기에 놓으세요</span>
                      <span className={styles.aiDragSub}>PDF · JPG · PNG · WEBP</span>
                    </div>
                  )}

                  {/* 파일 미리보기 */}
                  {aiFile && !aiDragOver && (
                    <div className={styles.aiFilePreview}>
                      <div className={`${styles.aiFileIconBox} ${aiFile.type === "pdf" ? styles.aiFileIconPdf : styles.aiFileIconImg}`}>
                        {aiFile.type === "pdf" ? "📄" : "🖼️"}
                      </div>
                      <div className={styles.aiFileMeta}>
                        <div className={styles.aiFileName}>{aiFile.file.name}</div>
                        <div className={styles.aiFileSize}>
                          {aiFile.file.size > 1024 * 1024
                            ? (aiFile.file.size / 1024 / 1024).toFixed(1) + "MB"
                            : Math.round(aiFile.file.size / 1024) + "KB"}
                        </div>
                        <span className={`${styles.aiFileBadge} ${aiFile.type === "pdf" ? styles.aiFileBadgePdf : styles.aiFileBadgeImg}`}>
                          {aiFile.type === "pdf" ? "PDF 텍스트 추출" : "👁 Vision OCR 분석"}
                        </span>
                      </div>
                      <button className={styles.aiFileRemove} onClick={() => { setAiFile(null); setAiError(""); }}>✕</button>
                    </div>
                  )}

                  {/* 텍스트 입력 (파일 없을 때) */}
                  {!aiFile && !aiDragOver && (
                    <textarea
                      className={styles.aiTextarea}
                      value={aiText}
                      onChange={e => setAiText(e.target.value)}
                      rows={10}
                      placeholder={"계약서나 약관 내용을 여기에 붙여넣으세요.\n\n또는 PDF · 이미지 파일을 이 영역에 드래그해서 올려주세요."}
                    />
                  )}

                  {/* 툴바 */}
                  <div className={styles.aiToolbar}>
                    <div className={styles.aiToolbarLeft}>
                      <span className={styles.aiToolbarHint}>
                        {aiFile
                          ? (aiFile.type === "pdf" ? "PDF에서 텍스트를 추출해 분석합니다" : "Vision AI가 이미지를 직접 읽고 분석합니다")
                          : "PDF나 이미지를 드래그하거나"}
                      </span>
                      {!aiFile && (
                        <>
                          <label className={styles.aiFileBtn}>
                            📎 파일 선택
                            <input
                              type="file"
                              accept=".pdf,image/jpeg,image/png,image/webp"
                              style={{ display: "none" }}
                              onChange={e => { handleAiFile(e.target.files[0]); e.target.value = ""; }}
                            />
                          </label>
                        </>
                      )}
                    </div>
                    {!aiFile && (
                      <span className={styles.aiCharCount}>{aiText.length.toLocaleString()} / 8,000자</span>
                    )}
                  </div>
                </div>

                <button
                  className={styles.aiAnalyzeBtn}
                  onClick={handleAiAnalyze}
                  disabled={aiLoading || (isLoggedIn && !aiFile && aiText.trim().length < 10)}
                >
                  {aiLoading
                    ? <span className={styles.aiLoadingWrap}><span className={styles.dots}><span /><span /><span /></span>AI 분석 중...</span>
                    : isLoggedIn ? "🤖 AI 계약서 분석하기" : "🔒 로그인 후 분석하기"}
                </button>
              </div>

              {/* 분석 중 단계 표시 */}
              {aiLoading && (
                <div className={styles.aiStepWrap}>
                  <div className={styles.aiStepItem + " " + styles.aiStepDone}>✓ 계약서 유형 파악 중</div>
                  <div className={styles.aiStepItem + " " + styles.aiStepDone}>✓ 조항 추출 중</div>
                  <div className={styles.aiStepItem + " " + styles.aiStepDone}>✓ 위험도 분류 중</div>
                  <div className={styles.aiStepItem + " " + styles.aiStepActive}>
                    <span className={styles.aiStepSpinner} /> AI 평가 생성 중...
                  </div>
                </div>
              )}
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

                  {/* 변호사 연결 CTA — 위험/주의 계약서일 때 표시 */}
                  {(aiResult?.risk === "danger" || aiResult?.risk === "caution") && (
                    <div className={`${styles.lawyerCta} ${aiResult.risk === "danger" ? styles.lawyerCtaDanger : styles.lawyerCtaCaution}`}>
                      <div className={styles.lawyerCtaContent}>
                        <div className={styles.lawyerCtaTitle}>
                          {aiResult.risk === "danger" ? "⚠️ 위험 조항이 발견됐어요" : "💡 전문가 검토를 받아보세요"}
                        </div>
                        <div className={styles.lawyerCtaDesc}>불리한 조항이 있을 수 있습니다. 변호사에게 검토받으면 더 안전하게 계약할 수 있어요.</div>
                      </div>
                      <a
                        href="https://www.lawtalk.co.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.lawyerCtaBtn}
                      >
                        변호사 연결하기 →
                      </a>
                    </div>
                  )}

                  <button className={styles.aiResetBtn} onClick={() => { setAiResult(null); setAiText(""); setAiFile(null); setAiError(""); }}>다시 분석하기</button>
                  <button className={styles.aiShareBtn} onClick={handleShare}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    결과 공유하기
                  </button>
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
                      <div className={styles.aiSampleItem} style={{ background: "#e8f3fd", borderColor: "#b3d4f5" }}>
                        <div className={styles.aiSampleItemHeader}><span className={styles.aiSampleDot} style={{ background: "#3C91E6" }} /><span style={{ color: "#1e5fa8", fontSize: 10, fontWeight: 700 }}>확인</span><span className={styles.aiSampleItemTitle}>계약 기간</span></div>
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

              {/* ─── AI 분석 히스토리 ─── */}
              {isLoggedIn && (
                <div className={styles.aiHistorySection}>
                  <button
                    className={styles.aiHistoryToggle}
                    onClick={() => setAiHistoryOpen(v => !v)}
                  >
                    <span className={styles.aiHistoryToggleLeft}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      분석 내역
                      {aiHistory.length > 0 && <span className={styles.aiHistoryCount}>{aiHistory.length}</span>}
                    </span>
                    <span className={styles.aiHistoryChevron}>{aiHistoryOpen ? "▲" : "▼"}</span>
                  </button>

                  {aiHistoryOpen && (
                    <div className={styles.aiHistoryBody}>
                      {aiHistoryLoading ? (
                        <div className={styles.aiHistoryLoading}>
                          <div className={styles.aiHistorySpinner} />
                          <span>불러오는 중...</span>
                        </div>
                      ) : aiHistory.length === 0 ? (
                        <div className={styles.aiHistoryEmpty}>
                          <span>아직 분석한 계약서가 없어요.</span>
                          <span className={styles.aiHistoryEmptySub}>위에서 계약서를 분석하면 내역이 여기에 저장됩니다.</span>
                        </div>
                      ) : (
                        <div className={styles.aiHistoryList}>
                          {aiHistory.map(item => {
                            const riskConfig = {
                              safe:    { label: "안전", color: "#2a9d5c", bg: "#edf7ef", border: "#b7dfc0" },
                              caution: { label: "주의", color: "#d08600", bg: "#fff8e8", border: "#f0d68a" },
                              danger:  { label: "위험", color: "#e03535", bg: "#fff1f1", border: "#ffcccc" },
                            }[item.risk] || { label: "확인", color: "#3C91E6", bg: "#e8f3fd", border: "#b3d4f5" };
                            const date = new Date(item.created_at);
                            const dateStr = `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
                            return (
                              <div key={item.id} className={styles.aiHistoryItem}>
                                <div className={styles.aiHistoryItemLeft}>
                                  <div className={styles.aiHistoryItemTop}>
                                    <span className={styles.aiHistoryItemType}>{item.contract_type || "계약서"}</span>
                                    <span
                                      className={styles.aiHistoryItemRisk}
                                      style={{ color: riskConfig.color, background: riskConfig.bg, border: `1px solid ${riskConfig.border}` }}
                                    >
                                      {riskConfig.label}
                                    </span>
                                  </div>
                                  <div className={styles.aiHistoryItemSummary}>{item.summary}</div>
                                </div>
                                <div className={styles.aiHistoryItemDate}>{dateStr}</div>
                              </div>
                            );
                          })}
                          {aiHistory.length >= 10 && (
                            <div className={styles.aiHistoryMore}>최근 10건만 표시됩니다.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── 모바일 하단 여백 ─── */}
        <div className={styles.mobileBottomPad} />

        {/* ─── 계산기 탭 ─── */}
        {tab === "calc" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>법률 계산기</div>
              <h1 className={styles.heroTitle}>수치로 바로<br />확인하세요</h1>
              <p className={styles.heroDesc}>주휴수당, 퇴직금, 전세 위험도를 즉시 계산합니다.</p>
            </section>

            {/* 계산기 카테고리 — 회사 / 부동산 */}
            <div className={styles.calcCatRow}>
              <div className={styles.calcCatGroup}>
                <div className={styles.calcCatLabel}>직장·알바</div>
                <div className={styles.calcTabRow}>
                  {[
                    { id: "wage",      label: "주휴수당" },
                    { id: "overtime",  label: "주말·시간외" },
                    { id: "severance", label: "퇴직금" },
                  ].map(t => (
                    <button key={t.id} className={`${styles.calcTabBtn} ${calcType === t.id ? styles.calcTabBtnActive : ""}`} onClick={() => setCalcType(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.calcCatGroup}>
                <div className={styles.calcCatLabel}>부동산·대출</div>
                <div className={styles.calcTabRow}>
                  {[
                    { id: "jeonse",  label: "전세가율" },
                    { id: "monthly", label: "월세↔전세" },
                    { id: "loan",    label: "대출 상환" },
                    { id: "ltv",     label: "LTV·DTI·DSR" },
                    { id: "prepay",  label: "중도상환수수료" },
                  ].map(t => (
                    <button key={t.id} className={`${styles.calcTabBtn} ${calcType === t.id ? styles.calcTabBtnActive : ""}`} onClick={() => setCalcType(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.calcCard}>
              {/* 주휴수당 */}
              {calcType === "wage" && (
                <>
                  <div className={styles.calcTitle}>주휴수당 계산기</div>
                  <div className={styles.calcInfo}>📌 주 15시간 이상 개근하면 하루치 임금(주휴수당)을 추가로 받을 수 있습니다.</div>
                  <div className={styles.calcTwoCol}>
                    <div className={styles.calcTwoColLeft}>
                      <div className={styles.calcFieldRow}>
                        <div className={styles.calcField}>
                          <label className={styles.calcLabel}>시급 (원)</label>
                          <input className={styles.calcInput} type="number" placeholder="2025년 최저 10,030원" value={wageHourly} onChange={e => setWageHourly(e.target.value)} />
                        </div>
                        <div className={styles.calcField}>
                          <label className={styles.calcLabel}>주 소정근로시간</label>
                          <input className={styles.calcInput} type="number" placeholder="예: 20" value={wageHours} onChange={e => setWageHours(e.target.value)} />
                        </div>
                      </div>
                      {calcWage() !== null && (
                        <div className={styles.calcResultBox}>
                          {calcWage().result === 0 ? (
                            <div className={styles.calcResultNote}>{calcWage().note}</div>
                          ) : (
                            <>
                              <div className={styles.calcResultLabel}>주당 주휴수당</div>
                              <div className={styles.calcResultAmount}>{calcWage().result.toLocaleString()}<span className={styles.calcResultUnit}>원</span></div>
                              <div className={styles.calcResultKorean}>{toKoreanAmount(calcWage().result)}</div>
                              <div className={styles.calcResultSub}>월 환산 약 {calcWage().monthly?.toLocaleString()}원 ({toKoreanAmount(calcWage().monthly)}) · {calcWage().note}</div>
                              <div className={styles.calcResultFormula}>계산식: (주 {wageHours}시간 ÷ 40시간) × 8시간 × 시급 {parseFloat(wageHourly).toLocaleString()}원</div>
                            </>
                          )}
                        </div>
                      )}
                      <div className={styles.calcTipBox}>
                        <div className={styles.calcTipTitle}>🔎 알아두세요</div>
                        <ul className={styles.calcTipList}>
                          <li>주 15시간 미만 근무자는 주휴수당 미발생</li>
                          <li>결근이 있으면 해당 주 주휴수당 미발생</li>
                          <li>월급제는 이미 포함된 경우가 많으니 계약서 확인 필요</li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.calcTwoColRight}>
                      <div className={styles.calcSideTitle}>주말·시간외 수당 함께 계산</div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>시급 (원)</label>
                        <input className={styles.calcInput} type="number" placeholder="2025년 최저 10,030원" value={otHourly} onChange={e => setOtHourly(e.target.value)} />
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>주말 근무 시간 <span className={styles.calcLabelNote}>×1.5배</span></label>
                        <input className={styles.calcInput} type="number" placeholder="예: 8" value={otWeekendHours} onChange={e => setOtWeekendHours(e.target.value)} />
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>연장 근무 시간 <span className={styles.calcLabelNote}>×1.5배</span></label>
                        <input className={styles.calcInput} type="number" placeholder="예: 4" value={otOvertimeHours} onChange={e => setOtOvertimeHours(e.target.value)} />
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 16 }}>
                        <label className={styles.calcLabel}>야간 근무 시간 <span className={styles.calcLabelNote}>22:00~06:00 +0.5</span></label>
                        <input className={styles.calcInput} type="number" placeholder="예: 2" value={otNightHours} onChange={e => setOtNightHours(e.target.value)} />
                      </div>
                      {calcOvertime() !== null && (() => {
                        const ot = calcOvertime();
                        return (
                          <div className={styles.calcSideResultBox}>
                            <div className={styles.calcSideResultRow}><span>주말 수당</span><span>{ot.weekendPay.toLocaleString()}원<span className={styles.calcSideKorean}> {toKoreanAmount(ot.weekendPay)}</span></span></div>
                            <div className={styles.calcSideResultRow}><span>연장 수당</span><span>{ot.overtimePay.toLocaleString()}원<span className={styles.calcSideKorean}> {toKoreanAmount(ot.overtimePay)}</span></span></div>
                            <div className={styles.calcSideResultRow}><span>야간 가산</span><span>{ot.nightPay.toLocaleString()}원<span className={styles.calcSideKorean}> {toKoreanAmount(ot.nightPay)}</span></span></div>
                            <div className={styles.calcSideResultTotal}><span>합계</span><span>{ot.total.toLocaleString()}원 <span className={styles.calcResultKorean} style={{ fontSize: 12 }}>{toKoreanAmount(ot.total)}</span></span></div>
                          </div>
                        );
                      })()}
                      <div className={styles.calcSideTip}>5인 이상 사업장에 적용 · 5인 미만은 가산 적용 안 됨</div>
                    </div>
                  </div>
                </>
              )}

              {/* 주말·시간외 수당 단독 탭 */}
              {calcType === "overtime" && (
                <>
                  <div className={styles.calcTitle}>주말·시간외 수당 계산기</div>
                  <div className={styles.calcInfo}>📌 주말(휴일)근무·연장근무는 통상임금의 50% 가산, 야간(22:00~06:00)은 추가 50% 가산입니다. (5인 이상 사업장 적용)</div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>시급 (원)</label>
                      <input className={styles.calcInput} type="number" placeholder="2025년 최저 10,030원" value={otHourly} onChange={e => setOtHourly(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>주말(휴일) 근무 시간 <span className={styles.calcLabelNote}>×1.5배</span></label>
                      <input className={styles.calcInput} type="number" placeholder="예: 8" value={otWeekendHours} onChange={e => setOtWeekendHours(e.target.value)} />
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>연장 근무 시간 <span className={styles.calcLabelNote}>×1.5배</span></label>
                      <input className={styles.calcInput} type="number" placeholder="예: 4" value={otOvertimeHours} onChange={e => setOtOvertimeHours(e.target.value)} />
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>야간 근무 시간 <span className={styles.calcLabelNote}>22:00~06:00 +0.5</span></label>
                      <input className={styles.calcInput} type="number" placeholder="예: 2" value={otNightHours} onChange={e => setOtNightHours(e.target.value)} />
                    </div>
                  </div>
                  {calcOvertime() !== null && (() => {
                    const ot = calcOvertime();
                    return (
                      <div className={styles.calcResultBox}>
                        <div className={styles.calcResultLabel}>이번 주 추가 수당 합계</div>
                        <div className={styles.calcResultAmount}>{ot.total.toLocaleString()}<span className={styles.calcResultUnit}>원</span></div>
                        <div className={styles.calcResultKorean}>{toKoreanAmount(ot.total)}</div>
                        <div className={styles.calcBreakdown}>
                          <div className={styles.calcBreakdownRow}><span>주말 수당 ({otWeekendHours || 0}h × {parseFloat(otHourly).toLocaleString()}원 × 1.5)</span><span>{ot.weekendPay.toLocaleString()}원 ({toKoreanAmount(ot.weekendPay)})</span></div>
                          <div className={styles.calcBreakdownRow}><span>연장 수당 ({otOvertimeHours || 0}h × {parseFloat(otHourly).toLocaleString()}원 × 1.5)</span><span>{ot.overtimePay.toLocaleString()}원 ({toKoreanAmount(ot.overtimePay)})</span></div>
                          <div className={styles.calcBreakdownRow}><span>야간 가산 ({otNightHours || 0}h × {parseFloat(otHourly).toLocaleString()}원 × 0.5)</span><span>{ot.nightPay.toLocaleString()}원 ({toKoreanAmount(ot.nightPay)})</span></div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className={styles.calcTipBox}>
                    <div className={styles.calcTipTitle}>🔎 알아두세요</div>
                    <ul className={styles.calcTipList}>
                      <li>5인 미만 사업장은 연장·야간·휴일 가산수당 적용 안 됨</li>
                      <li>주말 근무 8시간 초과분은 휴일연장근로로 추가 가산</li>
                      <li>야간 + 연장이 겹치면 가산율 중복 적용 가능 (통상임금 200%)</li>
                    </ul>
                  </div>
                </>
              )}

              {/* 퇴직금 */}
              {calcType === "severance" && (
                <>
                  <div className={styles.calcTitle}>퇴직금 계산기</div>
                  <div className={styles.calcInfo}>📌 1년 이상 근무하고 퇴직 시 1개월치 평균임금을 퇴직금으로 받을 수 있습니다.</div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>월 평균임금 (원)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 2500000" value={sevMonthly} onChange={e => setSevMonthly(e.target.value)} />
                      {sevMonthly && <div className={styles.calcInputHint}>{toKoreanAmount(parseFloat(sevMonthly))}</div>}
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>총 근무 개월수</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 24 (2년)" value={sevMonths} onChange={e => setSevMonths(e.target.value)} />
                    </div>
                  </div>
                  {(() => {
                    const m = parseFloat(sevMonthly);
                    const months = parseFloat(sevMonths);
                    if (!m || !months) return null;
                    if (months < 12) return <div className={styles.calcResultBox}><div className={styles.calcResultNote}>1년(12개월) 미만 근무는 퇴직금이 발생하지 않습니다.</div></div>;
                    const years = months / 12;
                    const result = Math.round(m * years);
                    return (
                      <div className={styles.calcResultBox}>
                        <div className={styles.calcResultLabel}>예상 퇴직금</div>
                        <div className={styles.calcResultAmount}>{result.toLocaleString()}<span className={styles.calcResultUnit}>원</span></div>
                        <div className={styles.calcResultKorean}>{toKoreanAmount(result)}</div>
                        <div className={styles.calcResultSub}>{months}개월({years.toFixed(1)}년) 근무 기준</div>
                        <div className={styles.calcResultFormula}>계산식: 월평균임금 {m.toLocaleString()}원 × 근속연수 {years.toFixed(2)}년</div>
                      </div>
                    );
                  })()}
                  <div className={styles.calcTipBox}>
                    <div className={styles.calcTipTitle}>🔎 알아두세요</div>
                    <ul className={styles.calcTipList}>
                      <li>5인 미만 사업장도 퇴직금 지급 의무 있음 (2010년 이후)</li>
                      <li>계약직·아르바이트도 1년 이상이면 퇴직금 발생</li>
                      <li>퇴직금은 퇴직 후 14일 이내 지급이 원칙</li>
                    </ul>
                  </div>
                </>
              )}

              {/* 전세가율 */}
              {calcType === "jeonse" && (
                <>
                  <div className={styles.calcTitle}>전세가율 위험도 계산기</div>
                  <div className={styles.calcInfo}>📌 전세가율 = 전세보증금 ÷ 매매가. 70% 이상이면 주의, 80% 이상이면 깡통전세 위험.</div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>주택 매매가 (만원)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 30000 (3억)" value={jeonseSale} onChange={e => setJeonseSale(e.target.value)} />
                      {jeonseSale && <div className={styles.calcInputHint}>{toKoreanManwon(jeonseSale)}</div>}
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>전세 보증금 (만원)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 22000 (2.2억)" value={jeonseDeposit} onChange={e => setJeonseDeposit(e.target.value)} />
                      {jeonseDeposit && <div className={styles.calcInputHint}>{toKoreanManwon(jeonseDeposit)}</div>}
                    </div>
                  </div>
                  {calcJeonse() !== null && (() => {
                    const j = calcJeonse();
                    const s2 = {
                      safe:   { bg: "#edf7ef", border: "#b7dfc0", text: "#276b3a", bar: "#2a9d5c" },
                      warn:   { bg: "#fff8e8", border: "#f0d68a", text: "#7a5000", bar: "#d08600" },
                      danger: { bg: "#fff1f1", border: "#ffcccc", text: "#c00000", bar: "#e03535" },
                    }[j.level];
                    return (
                      <div className={styles.calcResultBox} style={{ background: s2.bg, borderColor: s2.border }}>
                        <div className={styles.calcResultLabel} style={{ color: s2.text }}>전세가율</div>
                        <div className={styles.calcResultAmount} style={{ color: s2.text }}>{j.ratio}%<span className={styles.calcResultUnit} style={{ color: s2.text }}> — {j.label}</span></div>
                        <div className={styles.calcRatioBar}>
                          <div className={styles.calcRatioFill} style={{ width: `${Math.min(j.ratio, 100)}%`, background: s2.bar }} />
                          <div className={styles.calcRatioMarker} style={{ left: "70%" }} />
                          <div className={styles.calcRatioMarker} style={{ left: "80%", background: "#e03535" }} />
                        </div>
                        <div className={styles.calcRatioLabels}>
                          <span>0%</span><span style={{ marginLeft: "auto" }}>70%(주의)</span><span style={{ marginLeft: 8 }}>80%(위험)</span>
                        </div>
                        <div className={styles.calcResultSub} style={{ color: s2.text }}>{j.desc}</div>
                      </div>
                    );
                  })()}
                  <div className={styles.calcTipBox}>
                    <div className={styles.calcTipTitle}>🔎 전세 계약 체크리스트</div>
                    <ul className={styles.calcTipList}>
                      <li>계약 전 — 등기부등본 근저당 확인, 전세가율 60~70% 이하 목표</li>
                      <li>계약 후 당일 — 전입신고 + 확정일자 동시에</li>
                      <li>보증금 보호 — HUG 전세보증보험 가입 강력 권장</li>
                      <li>잔금 당일 직전 등기부 재확인 필수</li>
                    </ul>
                  </div>
                </>
              )}

              {/* 월세↔전세 + 우측 대출 계산기 */}
              {calcType === "monthly" && (
                <>
                  <div className={styles.calcTitle}>월세 ↔ 전세 환산기</div>
                  <div className={styles.calcInfo}>📌 연 이자율 4% 기준으로 월세와 전세를 상호 환산합니다. (금리에 따라 달라질 수 있음)</div>
                  <div className={styles.calcTwoCol}>
                    <div className={styles.calcTwoColLeft}>
                      <div className={styles.calcFieldRow}>
                        <div className={styles.calcField}>
                          <label className={styles.calcLabel}>보증금 (만원)</label>
                          <input className={styles.calcInput} type="number" placeholder="예: 1000" value={monthlyDeposit} onChange={e => setMonthlyDeposit(e.target.value)} />
                          {monthlyDeposit && <div className={styles.calcInputHint}>{toKoreanManwon(monthlyDeposit)}</div>}
                        </div>
                        <div className={styles.calcField}>
                          <label className={styles.calcLabel}>월세 (만원)</label>
                          <input className={styles.calcInput} type="number" placeholder="예: 50" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
                          {monthlyRent && <div className={styles.calcInputHint}>{toKoreanManwon(monthlyRent)}</div>}
                        </div>
                      </div>
                      {calcMonthly() !== null && (() => {
                        const r = calcMonthly();
                        return (
                          <div className={styles.calcResultBox}>
                            <div className={styles.calcResultLabel}>전세 환산 금액</div>
                            <div className={styles.calcResultAmount}>{r.jeonse.toLocaleString()}<span className={styles.calcResultUnit}>만원</span></div>
                            <div className={styles.calcResultKorean}>{toKoreanManwon(String(r.jeonse))}</div>
                            <div className={styles.calcResultSub}>연간 월세 합계 {r.annualRent.toLocaleString()}만원 기준 (이자율 4% 적용)</div>
                            <div className={styles.calcResultFormula}>보증금 {parseInt(monthlyDeposit).toLocaleString()}만원 + (월세 {parseInt(monthlyRent).toLocaleString()}만원 × 12 ÷ 4%)</div>
                          </div>
                        );
                      })()}
                      <div className={styles.calcTipBox}>
                        <div className={styles.calcTipTitle}>🔎 알아두세요</div>
                        <ul className={styles.calcTipList}>
                          <li>전세 이자율이 오르면 월세가 상대적으로 유리해짐</li>
                          <li>월세는 소득세 세액공제 가능 (연 750만원 한도)</li>
                          <li>청년 월세 지원 대상이라면 정부지원 탭에서 확인</li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.calcTwoColRight}>
                      <div className={styles.calcSideTitle}>대출 월 상환액 빠른 계산</div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>대출 원금 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 20000 (2억)" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
                        {loanAmount && <div className={styles.calcInputHint}>{toKoreanManwon(loanAmount)}</div>}
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>연 금리 (%)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 3.5" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)} />
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 12 }}>
                        <label className={styles.calcLabel}>대출 기간 (년)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 30" value={loanYears} onChange={e => setLoanYears(e.target.value)} />
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 16 }}>
                        <label className={styles.calcLabel}>상환 방식</label>
                        <div className={styles.calcRadioRow}>
                          {[{ id: "equal", label: "원리금균등" }, { id: "equalPrincipal", label: "원금균등" }, { id: "bullet", label: "만기일시" }].map(t => (
                            <button key={t.id} className={`${styles.calcRadioBtn} ${loanType === t.id ? styles.calcRadioBtnActive : ""}`} onClick={() => setLoanType(t.id)}>{t.label}</button>
                          ))}
                        </div>
                      </div>
                      {calcLoan() !== null && (() => {
                        const l = calcLoan();
                        return (
                          <div className={styles.calcSideResultBox}>
                            <div className={styles.calcSideResultRow}><span>월 상환액</span><span className={styles.calcSideHighlight}>{l.monthly.toLocaleString()}원 <span className={styles.calcSideKorean}>{toKoreanAmount(l.monthly)}</span></span></div>
                            <div className={styles.calcSideResultRow}><span>총 이자</span><span>{l.totalInterest.toLocaleString()}원 <span className={styles.calcSideKorean}>{toKoreanAmount(l.totalInterest)}</span></span></div>
                            <div className={styles.calcSideResultTotal}><span>총 상환액</span><span>{l.totalRepay.toLocaleString()}원 <span className={styles.calcResultKorean} style={{ fontSize: 11 }}>{toKoreanAmount(l.totalRepay)}</span></span></div>
                          </div>
                        );
                      })()}
                      <div className={styles.calcSideTip}>자세한 대출 계산 → 대출 상환 탭</div>
                    </div>
                  </div>
                </>
              )}

              {/* 대출 상환 계산기 */}
              {calcType === "loan" && (
                <>
                  <div className={styles.calcTitle}>대출 상환 계산기</div>
                  <div className={styles.calcInfo}>📌 원리금균등·원금균등·만기일시 3가지 방식의 월 상환액과 총 이자를 비교합니다.</div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>대출 원금 (만원)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 20000 (2억)" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
                      {loanAmount && <div className={styles.calcInputHint}>{toKoreanManwon(loanAmount)}</div>}
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>연 금리 (%)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 3.5" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)} />
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>대출 기간 (년)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 30" value={loanYears} onChange={e => setLoanYears(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.calcField} style={{ marginBottom: 20 }}>
                    <label className={styles.calcLabel}>상환 방식</label>
                    <div className={styles.calcRadioRow}>
                      {[{ id: "equal", label: "원리금균등 (매월 동일)" }, { id: "equalPrincipal", label: "원금균등 (이자 감소)" }, { id: "bullet", label: "만기일시 (이자만 납부)" }].map(t => (
                        <button key={t.id} className={`${styles.calcRadioBtn} ${loanType === t.id ? styles.calcRadioBtnActive : ""}`} onClick={() => setLoanType(t.id)}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  {calcLoan() !== null && (() => {
                    const l = calcLoan();
                    return (
                      <div className={styles.calcResultBox}>
                        <div className={styles.calcResultLabel}>월 상환액</div>
                        <div className={styles.calcResultAmount}>{l.monthly.toLocaleString()}<span className={styles.calcResultUnit}>원</span></div>
                        <div className={styles.calcResultKorean}>{toKoreanAmount(l.monthly)}</div>
                        <div className={styles.calcBreakdown}>
                          <div className={styles.calcBreakdownRow}><span>대출 원금</span><span>{l.principal.toLocaleString()}원 ({toKoreanAmount(l.principal)})</span></div>
                          <div className={styles.calcBreakdownRow}><span>총 이자</span><span>{l.totalInterest.toLocaleString()}원 ({toKoreanAmount(l.totalInterest)})</span></div>
                          <div className={styles.calcBreakdownRow} style={{ fontWeight: 700 }}><span>총 상환액</span><span>{l.totalRepay.toLocaleString()}원 ({toKoreanAmount(l.totalRepay)})</span></div>
                        </div>
                        {loanType === "bullet" && <div className={styles.calcResultNote} style={{ marginTop: 8 }}>만기일시는 만기 시 원금 {toKoreanAmount(l.principal)} 일시 상환</div>}
                      </div>
                    );
                  })()}
                  <div className={styles.calcTipBox}>
                    <div className={styles.calcTipTitle}>🔎 상환 방식 비교</div>
                    <ul className={styles.calcTipList}>
                      <li>원리금균등 — 매월 동일 금액. 가장 일반적. 초기 이자 비중 높음</li>
                      <li>원금균등 — 매월 원금 고정, 이자 감소. 총 이자 가장 적음</li>
                      <li>만기일시 — 이자만 납부 후 만기에 원금 상환. 전세대출에 주로 사용</li>
                    </ul>
                  </div>
                </>
              )}

              {/* LTV·DTI·DSR 계산기 */}
              {calcType === "ltv" && (
                <>
                  <div className={styles.calcTitle}>LTV · DTI · DSR 계산기</div>
                  <div className={styles.calcInfo}>📌 대출 가능 여부와 한도를 결정하는 핵심 지표 3가지를 한 번에 계산합니다.</div>
                  <div className={styles.calcThreeCol}>
                    {/* LTV */}
                    <div className={styles.calcThreeItem}>
                      <div className={styles.calcSubTitle}>LTV (주택담보대출비율)</div>
                      <div className={styles.calcSubDesc}>대출 / 주택가격 · 일반 60%, 투기지역 40% 규제</div>
                      <div className={styles.calcField} style={{ marginBottom: 10 }}>
                        <label className={styles.calcLabel}>주택 가격 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 50000" value={ltvPrice} onChange={e => setLtvPrice(e.target.value)} />
                        {ltvPrice && <div className={styles.calcInputHint}>{toKoreanManwon(ltvPrice)}</div>}
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 14 }}>
                        <label className={styles.calcLabel}>대출 금액 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 30000" value={ltvLoan} onChange={e => setLtvLoan(e.target.value)} />
                        {ltvLoan && <div className={styles.calcInputHint}>{toKoreanManwon(ltvLoan)}</div>}
                      </div>
                      {calcLtv() && (() => {
                        const r = calcLtv();
                        const c = r.ltvLevel === "safe" ? "#2a9d5c" : r.ltvLevel === "warn" ? "#d08600" : "#e03535";
                        return <div className={styles.calcMiniMetric} style={{ borderColor: c }}><span className={styles.calcMiniMetricVal} style={{ color: c }}>{r.ltv}%</span><span className={styles.calcMiniMetricLabel} style={{ color: c }}>LTV {r.ltvLevel === "safe" ? "안전" : r.ltvLevel === "warn" ? "주의" : "초과"}</span></div>;
                      })()}
                    </div>

                    {/* DTI */}
                    <div className={styles.calcThreeItem}>
                      <div className={styles.calcSubTitle}>DTI (총부채상환비율)</div>
                      <div className={styles.calcSubDesc}>연간 원리금 / 연소득 · 40~60% 기준</div>
                      <div className={styles.calcField} style={{ marginBottom: 10 }}>
                        <label className={styles.calcLabel}>연소득 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 5000" value={dtiIncome} onChange={e => setDtiIncome(e.target.value)} />
                        {dtiIncome && <div className={styles.calcInputHint}>{toKoreanManwon(dtiIncome)}</div>}
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 14 }}>
                        <label className={styles.calcLabel}>월간 원리금 상환액 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 150 (월 150만원)" value={dtiRepay} onChange={e => setDtiRepay(e.target.value)} />
                        {dtiRepay && <div className={styles.calcInputHint}>{toKoreanManwon(dtiRepay)} / 월 → 연 {toKoreanManwon(String(parseFloat(dtiRepay) * 12))}</div>}
                      </div>
                      {calcDti() && (() => {
                        const r = calcDti();
                        const c = r.level === "safe" ? "#2a9d5c" : r.level === "warn" ? "#d08600" : "#e03535";
                        return (
                          <div className={styles.calcMiniMetric} style={{ borderColor: c }}>
                            <span className={styles.calcMiniMetricVal} style={{ color: c }}>{r.dti}%</span>
                            <span className={styles.calcMiniMetricLabel} style={{ color: c }}>DTI {r.level === "safe" ? "안전" : r.level === "warn" ? "주의" : "초과"}</span>
                            <span className={styles.calcMiniFormula}>월 {toKoreanManwon(dtiRepay)} × 12 ÷ 연 {toKoreanManwon(dtiIncome)}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* DSR */}
                    <div className={styles.calcThreeItem}>
                      <div className={styles.calcSubTitle}>DSR (총부채원리금상환비율)</div>
                      <div className={styles.calcSubDesc}>모든 대출 원리금 / 연소득 · 40% 규제</div>
                      <div className={styles.calcField} style={{ marginBottom: 10 }}>
                        <label className={styles.calcLabel}>연소득 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 5000" value={dsrIncome} onChange={e => setDsrIncome(e.target.value)} />
                        {dsrIncome && <div className={styles.calcInputHint}>{toKoreanManwon(dsrIncome)}</div>}
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 10 }}>
                        <label className={styles.calcLabel}>전체 대출 잔액 (만원)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 30000" value={dsrAllLoan} onChange={e => setDsrAllLoan(e.target.value)} />
                        {dsrAllLoan && <div className={styles.calcInputHint}>{toKoreanManwon(dsrAllLoan)}</div>}
                      </div>
                      <div className={styles.calcField} style={{ marginBottom: 14 }}>
                        <label className={styles.calcLabel}>평균 금리 (%)</label>
                        <input className={styles.calcInput} type="number" placeholder="예: 4.0" step="0.1" value={dsrAllRate} onChange={e => setDsrAllRate(e.target.value)} />
                      </div>
                      {calcDsr() && (() => {
                        const r = calcDsr();
                        const c = r.level === "safe" ? "#2a9d5c" : r.level === "warn" ? "#d08600" : "#e03535";
                        return <div className={styles.calcMiniMetric} style={{ borderColor: c }}><span className={styles.calcMiniMetricVal} style={{ color: c }}>{r.dsr}%</span><span className={styles.calcMiniMetricLabel} style={{ color: c }}>DSR {r.level === "safe" ? "안전(40% 이하)" : r.level === "warn" ? "주의(40~60%)" : "초과(60% 이상)"}</span></div>;
                      })()}
                    </div>
                  </div>
                  <div className={styles.calcTipBox} style={{ marginTop: 20 }}>
                    <div className={styles.calcTipTitle}>🔎 규제 기준 (2025년 기준)</div>
                    <ul className={styles.calcTipList}>
                      <li>LTV: 일반 주택 60%, 투기과열지구 40%, 생애최초 80%</li>
                      <li>DTI: 수도권 60% 이하 권고 (금융기관별 상이)</li>
                      <li>DSR: 총대출 1억 초과 시 40% 적용 (2단계 규제)</li>
                    </ul>
                  </div>
                </>
              )}

              {/* 중도상환수수료 계산기 */}
              {calcType === "prepay" && (
                <>
                  <div className={styles.calcTitle}>중도상환수수료 계산기</div>
                  <div className={styles.calcInfo}>📌 대출을 조기 상환할 때 발생하는 수수료입니다. 잔여 기간에 비례해 감소합니다.</div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>현재 대출 잔액 (만원)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 20000" value={prepayBalance} onChange={e => setPrepayBalance(e.target.value)} />
                      {prepayBalance && <div className={styles.calcInputHint}>{toKoreanManwon(prepayBalance)}</div>}
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>중도상환수수료율 (%)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 1.2 (통상 0.5~1.5%)" step="0.1" value={prepayFeeRate} onChange={e => setPrepayFeeRate(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.calcFieldRow}>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>현재까지 납부 개월수</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 18" value={prepayHoldMonths} onChange={e => setPrepayHoldMonths(e.target.value)} />
                    </div>
                    <div className={styles.calcField}>
                      <label className={styles.calcLabel}>수수료 면제 기간 (개월)</label>
                      <input className={styles.calcInput} type="number" placeholder="예: 36 (3년)" value={prepayTotalMonths} onChange={e => setPrepayTotalMonths(e.target.value)} />
                    </div>
                  </div>
                  {calcPrepay() !== null && (() => {
                    const p = calcPrepay();
                    return (
                      <div className={styles.calcResultBox}>
                        <div className={styles.calcResultLabel}>예상 중도상환수수료</div>
                        <div className={styles.calcResultAmount}>{p.fee.toLocaleString()}<span className={styles.calcResultUnit}>원</span></div>
                        <div className={styles.calcResultKorean}>{toKoreanAmount(p.fee)}</div>
                        <div className={styles.calcResultFormula}>잔액 {toKoreanManwon(prepayBalance)} × 수수료율 {prepayFeeRate}% × 잔여비율 {p.ratio}%</div>
                      </div>
                    );
                  })()}
                  <div className={styles.calcTipBox}>
                    <div className={styles.calcTipTitle}>🔎 알아두세요</div>
                    <ul className={styles.calcTipList}>
                      <li>은행마다 수수료율과 면제 기간이 다름 (계약서 확인 필수)</li>
                      <li>변동금리는 수수료 없는 경우도 있음</li>
                      <li>수수료보다 절감되는 이자가 더 크면 상환이 유리</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ─── 정부지원 탭 ─── */}
        {tab === "support" && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBadge}>정부지원 퀵체커</div>
              <h1 className={styles.heroTitle}>내가 받을 수 있는<br />지원 찾기</h1>
              <p className={styles.heroDesc}>나이·소득·주거 3가지 입력으로 받을 수 있는 지원금을 확인하세요.</p>
            </section>

            {!checkDone ? (
              <div className={styles.supportCheckerCard}>
                <div className={styles.supportCheckerTitle}>간단한 정보를 입력해주세요</div>
                <div className={styles.supportField}>
                  <label className={styles.supportLabel}>나이 (만 나이)</label>
                  <input className={styles.supportInput} type="number" placeholder="예: 27" value={checkAge} onChange={e => setCheckAge(e.target.value)} />
                </div>
                <div className={styles.supportField}>
                  <label className={styles.supportLabel}>연소득 분위 (1~10분위)</label>
                  <div className={styles.supportSelectRow}>
                    {[
                      { v: 1, income: "~1,200만원" },
                      { v: 2, income: "~2,400만원" },
                      { v: 3, income: "~3,600만원" },
                      { v: 4, income: "~4,800만원" },
                      { v: 5, income: "~6,000만원" },
                      { v: 6, income: "~7,200만원" },
                      { v: 7, income: "~8,400만원" },
                      { v: 8, income: "~1억" },
                      { v: 9, income: "~1.3억" },
                      { v: 10, income: "1.3억+" },
                    ].map(({ v, income }) => (
                      <button key={v} className={`${styles.supportSelectBtn} ${checkIncome === String(v) ? styles.supportSelectBtnActive : ""}`}
                        onClick={() => setCheckIncome(String(v))}>
                        <span className={styles.supportSelectBtnNum}>{v}분위</span>
                        <span className={styles.supportSelectBtnIncome}>{income}</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.supportSelectHint}>1분위 = 하위 10% · 5분위 = 중간(연 ~6,000만원) · 10분위 = 상위 10%</div>
                </div>
                <div className={styles.supportField}>
                  <label className={styles.supportLabel}>현재 주거 형태</label>
                  <div className={styles.supportTypeRow}>
                    {[
                      { id: "renter", label: "🏠 임차인 (전·월세)" },
                      { id: "owner",  label: "🏡 자가 소유" },
                      { id: "other",  label: "🏢 기타 (기숙사·가족)" },
                    ].map(t => (
                      <button key={t.id} className={`${styles.supportTypeBtn} ${checkHouse === t.id ? styles.supportTypeBtnActive : ""}`}
                        onClick={() => setCheckHouse(t.id)}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <button
                  className={styles.supportRunBtn}
                  onClick={runSupportCheck}
                  disabled={!checkAge || !checkIncome || !checkHouse}
                >
                  받을 수 있는 지원 확인하기 →
                </button>
              </div>
            ) : (
              <div className={styles.supportResultWrap}>
                <div className={styles.supportResultHeader}>
                  <div className={styles.supportResultTitle}>
                    만 {checkAge}세 · {checkIncome}분위 · {checkHouse === "renter" ? "임차인" : checkHouse === "owner" ? "자가" : "기타"} 기준
                  </div>
                  <div className={styles.supportResultCount}>총 <strong>{checkResult?.length || 0}개</strong> 지원 해당</div>
                </div>
                {checkResult?.length === 0 ? (
                  <div className={styles.supportEmpty}>현재 입력한 조건으로 해당되는 지원을 찾지 못했습니다.</div>
                ) : (
                  <div className={styles.supportResultList}>
                    {checkResult?.map(s => (
                      <div key={s.id} className={styles.supportResultItem}>
                        <div className={styles.supportResultItemContent}>
                          <div className={styles.supportResultItemName}>{s.name}</div>
                          <div className={styles.supportResultItemDesc}>{s.desc}</div>
                        </div>
                        <a href={s.link} target="_blank" rel="noopener noreferrer" className={styles.supportResultItemLink}>신청하기 →</a>
                      </div>
                    ))}
                  </div>
                )}
                <button className={styles.supportResetBtn} onClick={() => setCheckDone(false)}>다시 확인하기</button>
                <div className={styles.supportDisclaimer}>⚠️ 지원 조건은 정책 변경에 따라 달라질 수 있습니다. 신청 전 공식 사이트에서 최신 내용을 반드시 확인하세요.</div>
              </div>
            )}

            {/* 기존 신청서류 안내 */}
            <div className={styles.quickSection} style={{ marginTop: 40 }}>
              <div className={styles.quickSectionTitle}>📑 신청 서류 안내</div>
              <div className={styles.popularGrid}>
                {APPLICATIONS.map(app => (
                  <Link key={app.id} href={`/doc/${app.id}`} className={styles.popularCard}>
                    <span className={styles.popularIcon}>{app.icon}</span>
                    <div className={styles.popularLabel}>{app.label}</div>
                    <div className={styles.popularDesc}>{app.summary}</div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── 숨김 파일 입력 — 계약서 사진 촬영 ─── */}
      <input
        ref={fabFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ position: "fixed", top: -9999, left: -9999, opacity: 0, width: 1, height: 1 }}
        onChange={e => { if (e.target.files[0]) { handleAiFile(e.target.files[0]); e.target.value = ""; } }}
      />
      {/* ─── 숨김 파일 입력 — 텍스트 사진 OCR ─── */}
      <input
        ref={fabOcrRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ position: "fixed", top: -9999, left: -9999, opacity: 0, width: 1, height: 1 }}
        onChange={e => { if (e.target.files[0]) { handleAiFile(e.target.files[0]); e.target.value = ""; } }}
      />

      {/* ─── FAB (모바일 전용, AI 탭에서만 표시) ─── */}
      {tab === "ai" && (
        <div className={styles.fabWrap}>
          {fabOpen && (
            <>
              <div className={styles.fabOverlay} onClick={() => setFabOpen(false)} />
              <div className={styles.fabMenu}>
                {/* 계약서 사진 촬영 */}
                <button className={styles.fabMenuItem} onClick={handleFabCamera}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  계약서 사진 촬영
                </button>
                {/* 텍스트 사진으로 붙여넣기 */}
                <button className={styles.fabMenuItem} onClick={handleFabOcr}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M8 10h8M8 14h5"/>
                    <circle cx="18" cy="18" r="3" fill="currentColor" stroke="none"/>
                    <path d="M16.5 18l1 1 2-2" stroke="#fff" strokeWidth="1.5"/>
                  </svg>
                  텍스트 사진으로 붙여넣기
                </button>
              </div>
            </>
          )}
          <button
            className={`${styles.fab} ${fabOpen ? styles.fabOpen : ""}`}
            onClick={() => setFabOpen(v => !v)}
            aria-label="계약서 업로드"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {fabOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>
              }
            </svg>
          </button>
        </div>
      )}

      {/* ─── 토스트 알림 ─── */}
      {bookmarkToast && (
        <div className={styles.toast}>{bookmarkToast.msg}</div>
      )}
      {shareToast && (
        <div className={styles.toast}>링크가 클립보드에 복사됐어요 📋</div>
      )}

      {/* ─── 모바일 하단 탭바 (5탭) ─── */}
      <nav className={styles.mobileTabBar} aria-label="주요 메뉴">
        <div className={styles.mobileTabInner}>
          {[
            { id: "home",    label: "홈",     icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            )},
            { id: "calc",    label: "계산기", icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="10" y2="10"/>
                <line x1="14" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="10" y2="14"/>
                <line x1="14" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="16" y2="18"/>
              </svg>
            )},
            { id: "support", label: "지원",   icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M6 20v-1a6 6 0 0 1 12 0v1"/>
                <path d="M19 8h2M3 8h2"/>
              </svg>
            )},
            { id: "list",    label: "전체",   icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            )},
            { id: "ai",      label: "AI분석", icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 4-2.6 7.4-6.3 8.6L12 22l-2.7-2.4C5.6 18.4 3 15 3 11a9 9 0 0 1 9-9z"/>
                <path d="M9 11l2 2 4-4"/>
              </svg>
            )},
          ].map(t => (
            <button key={t.id}
              className={`${styles.mobileTabBtn} ${tab === t.id ? styles.active : ""}`}
              onClick={() => handleTabChange(t.id)}
              aria-label={t.label}
              aria-selected={tab === t.id}
            >
              <span className={styles.mobileTabIcon}>{t.icon}</span>
              <span className={styles.mobileTabLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── 푸터 ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.brandMark} style={{ fontSize: 14 }}>온변</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>온라인 변호사</span>
          </div>
          <p className={styles.footerDisc}>본 사이트의 모든 정보는 참고용이며 법적 효력이 없습니다. 중요한 계약은 반드시 전문 변호사와 상담하세요.</p>
          <div className={styles.footerLinks}>
            <Link href="/terms" className={styles.footerLink}>이용약관</Link>
            <span className={styles.footerDivider}>·</span>
            <Link href="/service-terms" className={styles.footerLink}>서비스약관</Link>
            <span className={styles.footerDivider}>·</span>
            <Link href="/policy" className={styles.footerLink}>운영 정책</Link>
            <span className={styles.footerDivider}>·</span>
            <Link href="/privacy" className={styles.footerLink}>개인정보처리방침</Link>
            <span className={styles.footerDivider}>·</span>
            <span className={styles.footerCopy}>© 2025 온변. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
