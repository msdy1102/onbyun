"use client";
import { useState } from "react";
import Link from "next/link";

/* ── 헬퍼 ── */
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
const toKoreanManwon = (v) => {
  if (!v || isNaN(v)) return "";
  return toKoreanAmount(parseFloat(v) * 10000);
};

const S = {
  page: { minHeight:"100vh", background:"#FAFFFD", fontFamily:"'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif" },
  header: { background:"#fff", borderBottom:"1px solid #e8f0fb", position:"sticky", top:0, zIndex:20, boxShadow:"0 1px 0 rgba(60,145,230,0.06)" },
  headerInner: { maxWidth:960, margin:"0 auto", padding:"0 24px", height:56, display:"flex", alignItems:"center", gap:16 },
  logo: { display:"flex", alignItems:"center", gap:8, textDecoration:"none" },
  logoMark: { display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, background:"#3C91E6", color:"#fff", borderRadius:7, fontSize:12, fontWeight:700 },
  logoName: { fontSize:16, fontWeight:700, color:"#0f172a" },
  breadSep: { color:"#cbd5e1" },
  breadCurr: { fontSize:14, color:"#475569", fontWeight:600 },
  main: { maxWidth:960, margin:"0 auto", padding:"32px 24px 80px" },
  pageTitle: { fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.5px", marginBottom:8 },
  pageDesc: { fontSize:15, color:"#64748b", marginBottom:28, lineHeight:1.6 },
  catRow: { display:"flex", flexWrap:"wrap", gap:8, marginBottom:28 },
  catBtn: (active) => ({
    padding:"8px 16px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
    border: active ? "1.5px solid #3C91E6" : "1.5px solid #e2e8f0",
    background: active ? "#3C91E6" : "#fff",
    color: active ? "#fff" : "#475569",
  }),
  card: { background:"#fff", border:"1.5px solid #e8f0fb", borderRadius:20, padding:32, boxShadow:"0 4px 24px rgba(60,145,230,0.08)" },
  cardTitle: { fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:6 },
  cardInfo: { fontSize:13, color:"#64748b", background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, padding:"10px 14px", marginBottom:20, lineHeight:1.6 },
  fieldRow: { display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 },
  field: { display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:180 },
  label: { fontSize:13, fontWeight:600, color:"#334155" },
  labelNote: { fontSize:11, color:"#3C91E6", fontWeight:500, marginLeft:4 },
  input: { padding:"11px 14px", border:"1.5px solid #b3d4f5", borderRadius:10, fontSize:15, fontFamily:"inherit", color:"#0f172a", outline:"none", background:"#FAFFFD", width:"100%", boxSizing:"border-box" },
  inputHint: { fontSize:11, color:"#3C91E6", marginTop:3 },
  resultBox: (bg, border) => ({ background: bg||"#e8f3fd", border:`1px solid ${border||"#b3d4f5"}`, borderRadius:14, padding:"20px 24px", marginBottom:16 }),
  resultLabel: (c) => ({ fontSize:13, color:c||"#3C91E6", fontWeight:600, marginBottom:4 }),
  resultAmount: (c) => ({ fontSize:36, fontWeight:800, color:c||"#0f172a", letterSpacing:"-1px" }),
  resultUnit: { fontSize:16, fontWeight:400, marginLeft:4 },
  resultKorean: { fontSize:14, color:"#64748b", marginTop:4 },
  resultSub: { fontSize:12, color:"#64748b", marginTop:6, lineHeight:1.6 },
  resultFormula: { fontSize:11, color:"#94a3b8", marginTop:6, fontFamily:"monospace" },
  breakdown: { marginTop:12, borderTop:"1px solid #b3d4f5", paddingTop:12, display:"flex", flexDirection:"column", gap:6 },
  breakdownRow: { display:"flex", justifyContent:"space-between", fontSize:12, color:"#475569" },
  tipBox: { background:"#f0f7ff", borderRadius:12, padding:"14px 18px", marginTop:16 },
  tipTitle: { fontSize:13, fontWeight:700, color:"#1e3a5f", marginBottom:8 },
  tipList: { paddingLeft:18, display:"flex", flexDirection:"column", gap:4 },
  tipLi: { fontSize:13, color:"#475569", lineHeight:1.6 },
  twoCol: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 },
  ratioBar: { position:"relative", height:10, background:"#e2e8f0", borderRadius:5, margin:"12px 0 4px", overflow:"visible" },
  ratioFill: (w, bg) => ({ position:"absolute", left:0, top:0, height:"100%", width:w, background:bg, borderRadius:5, transition:"width 0.3s" }),
  ratioMarker: (l, bg) => ({ position:"absolute", top:-3, left:l, width:2, height:16, background:bg||"#d97706", borderRadius:2 }),
  ratioLabels: { display:"flex", fontSize:11, color:"#94a3b8", marginBottom:8 },
};

const CALC_TYPES = [
  { id:"wage", label:"주휴수당", group:"직장·알바" },
  { id:"overtime", label:"주말·시간외", group:"직장·알바" },
  { id:"severance", label:"퇴직금", group:"직장·알바" },
  { id:"jeonse", label:"전세가율", group:"부동산·대출" },
  { id:"monthly", label:"월세↔전세", group:"부동산·대출" },
  { id:"loan", label:"대출 상환", group:"부동산·대출" },
  { id:"ltv", label:"LTV·DTI·DSR", group:"부동산·대출" },
  { id:"prepay", label:"중도상환수수료", group:"부동산·대출" },
];

const LEVEL_STYLE = {
  safe:   { bg:"#f0fdf4", border:"#86efac", text:"#16a34a", bar:"#22c55e" },
  warn:   { bg:"#fffbeb", border:"#fde68a", text:"#d97706", bar:"#f59e0b" },
  danger: { bg:"#fff1f1", border:"#fca5a5", text:"#dc2626", bar:"#ef4444" },
};

export default function CalcPage() {
  const [calcType, setCalcType] = useState("wage");

  // 주휴수당
  const [wageHourly, setWageHourly] = useState("");
  const [wageHours, setWageHours] = useState("");
  // 시간외
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
  // 월세↔전세
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  // 대출
  const [loanAmount, setLoanAmount] = useState("");
  const [loanRate, setLoanRate] = useState("");
  const [loanYears, setLoanYears] = useState("");
  const [loanType, setLoanType] = useState("equal");
  // LTV
  const [ltvPrice, setLtvPrice] = useState("");
  const [ltvLoan, setLtvLoan] = useState("");
  const [dtiIncome, setDtiIncome] = useState("");
  const [dtiRepay, setDtiRepay] = useState("");
  const [dsrIncome, setDsrIncome] = useState("");
  const [dsrAllLoan, setDsrAllLoan] = useState("");
  const [dsrAllRate, setDsrAllRate] = useState("");
  // 중도상환
  const [prepayBalance, setPrepayBalance] = useState("");
  const [prepayFeeRate, setPrepayFeeRate] = useState("");
  const [prepayHoldMonths, setPrepayHoldMonths] = useState("");
  const [prepayTotalMonths, setPrepayTotalMonths] = useState("");

  // ── 계산 함수 ──
  const calcWage = () => {
    const h = parseFloat(wageHourly), w = parseFloat(wageHours);
    if (!h || !w || w <= 0) return null;
    if (w < 15) return { result: 0, note: "주 15시간 미만은 주휴수당 미발생" };
    const weekly = Math.round((w / 40) * 8 * h);
    return { result: weekly, monthly: Math.round(weekly * 4.345), note: `주 ${w}시간 × 시급 ${h.toLocaleString()}원` };
  };
  const calcOvertime = () => {
    const h = parseFloat(otHourly);
    if (!h) return null;
    const weekendPay = Math.round((parseFloat(otWeekendHours)||0) * h * 1.5);
    const overtimePay = Math.round((parseFloat(otOvertimeHours)||0) * h * 1.5);
    const nightPay = Math.round((parseFloat(otNightHours)||0) * h * 0.5);
    return { weekendPay, overtimePay, nightPay, total: weekendPay + overtimePay + nightPay };
  };
  const calcJeonse = () => {
    const sale = parseFloat(jeonseSale), dep = parseFloat(jeonseDeposit);
    if (!sale || !dep || sale <= 0) return null;
    const ratio = Math.round((dep / sale) * 100);
    let level = "safe", label = "안전", desc = "전세가율이 적정 수준입니다.";
    if (ratio >= 80) { level = "danger"; label = "위험"; desc = "깡통전세 위험이 높습니다. 전세보증보험 필수 가입을 권장합니다."; }
    else if (ratio >= 70) { level = "warn"; label = "주의"; desc = "전세가율이 높은 편입니다. 전세보증보험 가입을 검토하세요."; }
    return { ratio, level, label, desc };
  };
  const calcLoan = () => {
    const principal = parseFloat(loanAmount) * 10000;
    const annualRate = parseFloat(loanRate) / 100;
    const months = parseFloat(loanYears) * 12;
    if (!principal || !annualRate || !months) return null;
    const mr = annualRate / 12;
    let monthly, totalInterest;
    if (loanType === "equal") {
      monthly = Math.round(principal * mr * Math.pow(1+mr,months) / (Math.pow(1+mr,months)-1));
      totalInterest = Math.round(monthly * months - principal);
    } else if (loanType === "equalPrincipal") {
      monthly = Math.round(principal / months) + Math.round(principal * mr);
      totalInterest = Math.round(principal * mr * (months + 1) / 2);
    } else {
      monthly = Math.round(principal * mr);
      totalInterest = Math.round(monthly * months);
    }
    return { monthly, totalInterest, totalRepay: Math.round(principal + totalInterest), principal };
  };
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

  const inp = (val, setter, placeholder) => (
    <input
      style={S.input}
      type="number"
      placeholder={placeholder}
      value={val}
      onChange={e => setter(e.target.value)}
      onFocus={e => { e.target.style.borderColor="#3C91E6"; e.target.style.boxShadow="0 0 0 3px rgba(60,145,230,0.12)"; }}
      onBlur={e => { e.target.style.borderColor="#b3d4f5"; e.target.style.boxShadow="none"; }}
    />
  );

  const groups = [...new Set(CALC_TYPES.map(t => t.group))];

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link href="/" style={S.logo}>
            <span style={S.logoMark}>온</span>
            <span style={S.logoName}>온변</span>
          </Link>
          <span style={S.breadSep}>›</span>
          <span style={S.breadCurr}>법률 계산기</span>
          <Link href="/ai" style={{ marginLeft:"auto", padding:"7px 16px", background:"#3C91E6", color:"#fff", borderRadius:20, fontSize:13, fontWeight:700, textDecoration:"none" }}>
            ✦ AI 분석
          </Link>
        </div>
      </header>

      <main style={S.main}>
        <h1 style={S.pageTitle}>법률 계산기</h1>
        <p style={S.pageDesc}>주휴수당, 퇴직금, 전세 위험도, 대출 상환액을 즉시 계산합니다.</p>

        {/* 카테고리 버튼 */}
        <div style={{ marginBottom:24 }}>
          {groups.map(g => (
            <div key={g} style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>{g}</div>
              <div style={S.catRow}>
                {CALC_TYPES.filter(t => t.group === g).map(t => (
                  <button key={t.id} style={S.catBtn(calcType === t.id)} onClick={() => setCalcType(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>

          {/* ① 주휴수당 */}
          {calcType === "wage" && (() => {
            const r = calcWage();
            return (
              <>
                <div style={S.cardTitle}>주휴수당 계산기</div>
                <div style={S.cardInfo}>📌 주 15시간 이상 개근하면 하루치 임금(주휴수당)을 추가로 받을 수 있습니다.</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>시급 (원)</label>{inp(wageHourly, setWageHourly, "2025년 최저 10,030원")}</div>
                  <div style={S.field}><label style={S.label}>주 소정근로시간</label>{inp(wageHours, setWageHours, "예: 20")}</div>
                </div>
                {r !== null && (
                  r.result === 0
                    ? <div style={S.resultBox()}><div style={S.resultLabel()}>{r.note}</div></div>
                    : <div style={S.resultBox()}>
                        <div style={S.resultLabel()}>주당 주휴수당</div>
                        <div style={S.resultAmount()}>{r.result.toLocaleString()}<span style={S.resultUnit}>원</span></div>
                        <div style={S.resultKorean}>{toKoreanAmount(r.result)}</div>
                        <div style={S.resultSub}>월 환산 약 {r.monthly?.toLocaleString()}원 ({toKoreanAmount(r.monthly)})</div>
                        <div style={S.resultFormula}>계산식: (주 {wageHours}시간 ÷ 40) × 8시간 × {parseFloat(wageHourly).toLocaleString()}원</div>
                      </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 알아두세요</div>
                  <ul style={S.tipList}>
                    {["주 15시간 미만 근무자는 주휴수당 미발생","결근이 있으면 해당 주 주휴수당 미발생","월급제는 이미 포함된 경우가 많으니 계약서 확인 필요"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ② 주말·시간외 */}
          {calcType === "overtime" && (() => {
            const ot = calcOvertime();
            return (
              <>
                <div style={S.cardTitle}>주말·시간외 수당 계산기</div>
                <div style={S.cardInfo}>📌 주말(휴일)근무·연장근무는 통상임금의 50% 가산, 야간(22:00~06:00)은 추가 50% 가산입니다. (5인 이상 사업장 적용)</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>시급 (원)</label>{inp(otHourly, setOtHourly, "2025년 최저 10,030원")}</div>
                </div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>주말(휴일) 근무 시간 <span style={S.labelNote}>×1.5배</span></label>{inp(otWeekendHours, setOtWeekendHours, "예: 8")}</div>
                  <div style={S.field}><label style={S.label}>연장 근무 시간 <span style={S.labelNote}>×1.5배</span></label>{inp(otOvertimeHours, setOtOvertimeHours, "예: 4")}</div>
                  <div style={S.field}><label style={S.label}>야간 근무 시간 <span style={S.labelNote}>+0.5배</span></label>{inp(otNightHours, setOtNightHours, "예: 2")}</div>
                </div>
                {ot && (
                  <div style={S.resultBox()}>
                    <div style={S.resultLabel()}>이번 주 추가 수당 합계</div>
                    <div style={S.resultAmount()}>{ot.total.toLocaleString()}<span style={S.resultUnit}>원</span></div>
                    <div style={S.resultKorean}>{toKoreanAmount(ot.total)}</div>
                    <div style={S.breakdown}>
                      <div style={S.breakdownRow}><span>주말 수당</span><span>{ot.weekendPay.toLocaleString()}원</span></div>
                      <div style={S.breakdownRow}><span>연장 수당</span><span>{ot.overtimePay.toLocaleString()}원</span></div>
                      <div style={S.breakdownRow}><span>야간 가산</span><span>{ot.nightPay.toLocaleString()}원</span></div>
                    </div>
                  </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 알아두세요</div>
                  <ul style={S.tipList}>
                    {["5인 미만 사업장은 연장·야간·휴일 가산수당 적용 안 됨","주말 근무 8시간 초과분은 휴일연장근로로 추가 가산","야간 + 연장이 겹치면 가산율 중복 적용 가능 (통상임금 200%)"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ③ 퇴직금 */}
          {calcType === "severance" && (() => {
            const m = parseFloat(sevMonthly), months = parseFloat(sevMonths);
            const r = (!m || !months) ? null : months < 12 ? { err: "1년(12개월) 미만 근무는 퇴직금이 발생하지 않습니다." } : { result: Math.round(m * months / 12), years: (months/12).toFixed(2) };
            return (
              <>
                <div style={S.cardTitle}>퇴직금 계산기</div>
                <div style={S.cardInfo}>📌 1년 이상 근무하고 퇴직 시 1개월치 평균임금을 퇴직금으로 받을 수 있습니다.</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>월 평균임금 (원)</label>{inp(sevMonthly, setSevMonthly, "예: 2500000")}{sevMonthly && <div style={S.inputHint}>{toKoreanAmount(parseFloat(sevMonthly))}</div>}</div>
                  <div style={S.field}><label style={S.label}>총 근무 개월수</label>{inp(sevMonths, setSevMonths, "예: 24 (2년)")}</div>
                </div>
                {r && (r.err
                  ? <div style={S.resultBox()}><div style={S.resultLabel()}>{r.err}</div></div>
                  : <div style={S.resultBox()}>
                      <div style={S.resultLabel()}>예상 퇴직금</div>
                      <div style={S.resultAmount()}>{r.result.toLocaleString()}<span style={S.resultUnit}>원</span></div>
                      <div style={S.resultKorean}>{toKoreanAmount(r.result)}</div>
                      <div style={S.resultSub}>{sevMonths}개월({r.years}년) 근무 기준</div>
                      <div style={S.resultFormula}>계산식: 월평균임금 {parseFloat(sevMonthly).toLocaleString()}원 × 근속연수 {r.years}년</div>
                    </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 알아두세요</div>
                  <ul style={S.tipList}>
                    {["5인 미만 사업장도 퇴직금 지급 의무 있음 (2010년 이후)","계약직·아르바이트도 1년 이상이면 퇴직금 발생","퇴직금은 퇴직 후 14일 이내 지급이 원칙"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ④ 전세가율 */}
          {calcType === "jeonse" && (() => {
            const j = calcJeonse();
            const lv = j ? LEVEL_STYLE[j.level] : null;
            return (
              <>
                <div style={S.cardTitle}>전세가율 위험도 계산기</div>
                <div style={S.cardInfo}>📌 전세가율 = 전세보증금 ÷ 매매가. 70% 이상이면 주의, 80% 이상이면 깡통전세 위험.</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>주택 매매가 (만원)</label>{inp(jeonseSale, setJeonseSale, "예: 30000 (3억)")}{jeonseSale && <div style={S.inputHint}>{toKoreanManwon(jeonseSale)}</div>}</div>
                  <div style={S.field}><label style={S.label}>전세 보증금 (만원)</label>{inp(jeonseDeposit, setJeonseDeposit, "예: 22000 (2.2억)")}{jeonseDeposit && <div style={S.inputHint}>{toKoreanManwon(jeonseDeposit)}</div>}</div>
                </div>
                {j && lv && (
                  <div style={S.resultBox(lv.bg, lv.border)}>
                    <div style={S.resultLabel(lv.text)}>전세가율</div>
                    <div style={S.resultAmount(lv.text)}>{j.ratio}%<span style={{...S.resultUnit, color:lv.text}}> — {j.label}</span></div>
                    <div style={S.ratioBar}>
                      <div style={S.ratioFill(`${Math.min(j.ratio,100)}%`, lv.bar)} />
                      <div style={S.ratioMarker("70%")} />
                      <div style={S.ratioMarker("80%", "#ef4444")} />
                    </div>
                    <div style={S.ratioLabels}><span>0%</span><span style={{marginLeft:"auto"}}>70%(주의)</span><span style={{marginLeft:8}}>80%(위험)</span></div>
                    <div style={{...S.resultSub, color:lv.text}}>{j.desc}</div>
                  </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 전세 계약 체크리스트</div>
                  <ul style={S.tipList}>
                    {["계약 전 — 등기부등본 근저당 확인, 전세가율 60~70% 이하 목표","계약 후 당일 — 전입신고 + 확정일자 동시에","HUG 전세보증보험 가입 강력 권장","잔금 당일 직전 등기부 재확인 필수"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ⑤ 월세↔전세 */}
          {calcType === "monthly" && (() => {
            const dep = parseFloat(monthlyDeposit), rent = parseFloat(monthlyRent);
            const r = (dep && rent) ? { jeonse: Math.round(dep + (rent * 12) / 0.04) } : null;
            return (
              <>
                <div style={S.cardTitle}>월세 ↔ 전세 환산기</div>
                <div style={S.cardInfo}>📌 연 이자율 4% 기준으로 월세와 전세를 상호 환산합니다.</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>보증금 (만원)</label>{inp(monthlyDeposit, setMonthlyDeposit, "예: 1000")}{monthlyDeposit && <div style={S.inputHint}>{toKoreanManwon(monthlyDeposit)}</div>}</div>
                  <div style={S.field}><label style={S.label}>월세 (만원)</label>{inp(monthlyRent, setMonthlyRent, "예: 60")}{monthlyRent && <div style={S.inputHint}>{toKoreanManwon(monthlyRent)}</div>}</div>
                </div>
                {r && (
                  <div style={S.resultBox()}>
                    <div style={S.resultLabel()}>전세 환산 금액</div>
                    <div style={S.resultAmount()}>{r.jeonse.toLocaleString()}<span style={S.resultUnit}>만원</span></div>
                    <div style={S.resultKorean}>{toKoreanManwon(r.jeonse)}</div>
                    <div style={S.resultSub}>보증금 {dep.toLocaleString()}만원 + 월세 {rent.toLocaleString()}만원 × 12개월 ÷ 4%</div>
                  </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 알아두세요</div>
                  <ul style={S.tipList}>
                    {["실제 전환율은 지역·시세에 따라 다를 수 있습니다","금리 변화 시 이 계산기 결과와 차이가 날 수 있습니다","임대인과 협의 시 이 계산 결과를 참고자료로 활용하세요"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ⑥ 대출 상환 */}
          {calcType === "loan" && (() => {
            const r = calcLoan();
            const LOAN_TYPES = [{id:"equal",label:"원리금균등"},{id:"equalPrincipal",label:"원금균등"},{id:"bullet",label:"만기일시"}];
            return (
              <>
                <div style={S.cardTitle}>대출 월상환액 계산기</div>
                <div style={S.cardInfo}>📌 상환 방식에 따라 월 납부액과 총 이자가 크게 달라집니다.</div>
                <div style={{display:"flex", gap:8, marginBottom:16, flexWrap:"wrap"}}>
                  {LOAN_TYPES.map(t => (
                    <button key={t.id} onClick={() => setLoanType(t.id)}
                      style={{...S.catBtn(loanType===t.id), fontSize:12, padding:"6px 14px"}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>대출금액 (만원)</label>{inp(loanAmount, setLoanAmount, "예: 20000 (2억)")}{loanAmount && <div style={S.inputHint}>{toKoreanManwon(loanAmount)}</div>}</div>
                  <div style={S.field}><label style={S.label}>연 이자율 (%)</label>{inp(loanRate, setLoanRate, "예: 4.5")}</div>
                  <div style={S.field}><label style={S.label}>대출 기간 (년)</label>{inp(loanYears, setLoanYears, "예: 30")}</div>
                </div>
                {r && (
                  <div style={S.resultBox()}>
                    <div style={S.resultLabel()}>월 상환액</div>
                    <div style={S.resultAmount()}>{r.monthly.toLocaleString()}<span style={S.resultUnit}>원</span></div>
                    <div style={S.resultKorean}>{toKoreanAmount(r.monthly)}</div>
                    <div style={S.breakdown}>
                      <div style={S.breakdownRow}><span>총 상환액</span><span>{r.totalRepay.toLocaleString()}원 ({toKoreanAmount(r.totalRepay)})</span></div>
                      <div style={S.breakdownRow}><span>총 이자</span><span>{r.totalInterest.toLocaleString()}원 ({toKoreanAmount(r.totalInterest)})</span></div>
                    </div>
                  </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 상환 방식 비교</div>
                  <ul style={S.tipList}>
                    {["원리금균등: 매달 같은 금액 납부 — 가계 계획에 유리","원금균등: 초기 납부액이 높지만 총 이자 절감","만기일시: 매달 이자만 납부, 만기에 원금 상환"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ⑦ LTV·DTI·DSR */}
          {calcType === "ltv" && (() => {
            const ltv = (parseFloat(ltvPrice) && parseFloat(ltvLoan)) ? Math.round((parseFloat(ltvLoan)/parseFloat(ltvPrice))*1000)/10 : null;
            const ltvLv = ltv ? (ltv<=60?"safe":ltv<=80?"warn":"danger") : null;
            const dtiInc = parseFloat(dtiIncome)*10000, dtiRep = parseFloat(dtiRepay)*10000;
            const dti = (dtiInc && dtiRep) ? Math.round((dtiRep*12/dtiInc)*1000)/10 : null;
            const dtiLv = dti ? (dti<=40?"safe":dti<=60?"warn":"danger") : null;
            return (
              <>
                <div style={S.cardTitle}>LTV · DTI · DSR 계산기</div>
                <div style={S.cardInfo}>📌 LTV: 담보인정비율 / DTI: 총부채상환비율 / DSR: 총부채원리금상환비율</div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:13, fontWeight:700, color:"#334155", marginBottom:10}}>LTV (담보인정비율)</div>
                  <div style={S.fieldRow}>
                    <div style={S.field}><label style={S.label}>주택 가격 (만원)</label>{inp(ltvPrice, setLtvPrice, "예: 50000 (5억)")}{ltvPrice && <div style={S.inputHint}>{toKoreanManwon(ltvPrice)}</div>}</div>
                    <div style={S.field}><label style={S.label}>대출금액 (만원)</label>{inp(ltvLoan, setLtvLoan, "예: 25000 (2.5억)")}{ltvLoan && <div style={S.inputHint}>{toKoreanManwon(ltvLoan)}</div>}</div>
                  </div>
                  {ltv !== null && ltvLv && (
                    <div style={S.resultBox(LEVEL_STYLE[ltvLv].bg, LEVEL_STYLE[ltvLv].border)}>
                      <div style={S.resultLabel(LEVEL_STYLE[ltvLv].text)}>LTV</div>
                      <div style={S.resultAmount(LEVEL_STYLE[ltvLv].text)}>{ltv}%</div>
                      <div style={{...S.resultSub, color:LEVEL_STYLE[ltvLv].text}}>{ltvLv==="safe"?"양호 — 60% 이하":ltvLv==="warn"?"주의 — 60~80%":"위험 — 80% 초과"}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{fontSize:13, fontWeight:700, color:"#334155", marginBottom:10}}>DTI (총부채상환비율)</div>
                  <div style={S.fieldRow}>
                    <div style={S.field}><label style={S.label}>연소득 (만원)</label>{inp(dtiIncome, setDtiIncome, "예: 5000 (5천만)")}{dtiIncome && <div style={S.inputHint}>{toKoreanManwon(dtiIncome)}</div>}</div>
                    <div style={S.field}><label style={S.label}>월 원리금 상환액 (만원)</label>{inp(dtiRepay, setDtiRepay, "예: 150")}{dtiRepay && <div style={S.inputHint}>{toKoreanManwon(dtiRepay)}</div>}</div>
                  </div>
                  {dti !== null && dtiLv && (
                    <div style={S.resultBox(LEVEL_STYLE[dtiLv].bg, LEVEL_STYLE[dtiLv].border)}>
                      <div style={S.resultLabel(LEVEL_STYLE[dtiLv].text)}>DTI</div>
                      <div style={S.resultAmount(LEVEL_STYLE[dtiLv].text)}>{dti}%</div>
                      <div style={{...S.resultSub, color:LEVEL_STYLE[dtiLv].text}}>{dtiLv==="safe"?"양호 — 40% 이하":dtiLv==="warn"?"주의 — 40~60%":"위험 — 60% 초과"}</div>
                    </div>
                  )}
                </div>
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 규제 기준</div>
                  <ul style={S.tipList}>
                    {["LTV: 투기과열지구 40~50%, 조정대상지역 60%, 일반 70%","DTI: 투기과열지구 40~50%, 조정대상지역 50%","DSR: 모든 금융기관 총 대출 원리금 연소득의 40~50%"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}

          {/* ⑧ 중도상환수수료 */}
          {calcType === "prepay" && (() => {
            const r = calcPrepay();
            return (
              <>
                <div style={S.cardTitle}>중도상환수수료 계산기</div>
                <div style={S.cardInfo}>📌 대출 만기 전 조기 상환 시 부과되는 수수료를 계산합니다. 잔여 기간이 길수록 수수료가 높습니다.</div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>대출 잔액 (만원)</label>{inp(prepayBalance, setPrepayBalance, "예: 15000 (1.5억)")}{prepayBalance && <div style={S.inputHint}>{toKoreanManwon(prepayBalance)}</div>}</div>
                  <div style={S.field}><label style={S.label}>중도상환수수료율 (%)</label>{inp(prepayFeeRate, setPrepayFeeRate, "예: 1.2")}</div>
                </div>
                <div style={S.fieldRow}>
                  <div style={S.field}><label style={S.label}>현재 보유 개월 (개월)</label>{inp(prepayHoldMonths, setPrepayHoldMonths, "예: 12")}</div>
                  <div style={S.field}><label style={S.label}>총 대출 기간 (개월)</label>{inp(prepayTotalMonths, setPrepayTotalMonths, "예: 36")}</div>
                </div>
                {r && (
                  <div style={S.resultBox()}>
                    <div style={S.resultLabel()}>예상 중도상환수수료</div>
                    <div style={S.resultAmount()}>{r.fee.toLocaleString()}<span style={S.resultUnit}>원</span></div>
                    <div style={S.resultKorean}>{toKoreanAmount(r.fee)}</div>
                    <div style={S.resultSub}>잔여기간 비율: {r.ratio}%</div>
                  </div>
                )}
                <div style={S.tipBox}>
                  <div style={S.tipTitle}>🔎 알아두세요</div>
                  <ul style={S.tipList}>
                    {["통상 대출 실행 후 3년이 지나면 중도상환수수료 면제","일부 상환과 전액 상환에 따라 수수료율이 다를 수 있음","수수료 면제 특약이 있는 경우 계약서 확인 필요"].map((t,i) => <li key={i} style={S.tipLi}>{t}</li>)}
                  </ul>
                </div>
              </>
            );
          })()}
        </div>

        {/* 면책 */}
        <div style={{ marginTop:24, padding:"12px 16px", background:"#f0f7ff", border:"1px solid #b3d4f5", borderRadius:10, fontSize:12, color:"#64748b" }}>
          본 계산기는 참고용이며 실제 수치와 다를 수 있습니다. 중요한 결정은 전문가와 상담하세요.
        </div>
      </main>

      <footer style={{ borderTop:"1px solid #e8f0fb", padding:24, background:"#fff", textAlign:"center" }}>
        <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7 }}>
          본 사이트의 모든 정보는 참고용이며 법적 효력이 없습니다.<br/>© 2025 온변(Onbyun). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
