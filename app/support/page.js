"use client";
import { useState } from "react";
import Link from "next/link";
import { APPLICATIONS } from "../data";

const GOV_SUPPORTS = [
  { id:"monthly-rent", name:"청년 월세 지원", desc:"월 최대 20만원, 최대 12개월 지원", link:"https://youth.myhome.go.kr", cond:(age,income,house)=>age>=19&&age<=34&&income<=5&&house==="renter" },
  { id:"youth-loan", name:"청년 버팀목 전세대출", desc:"연 2.1~2.9% 저금리 전세자금 대출", link:"https://nhuf.molit.go.kr", cond:(age,income,house)=>age>=19&&age<=34&&income<=5&&house==="renter" },
  { id:"youth-dooryak", name:"청년도약계좌", desc:"월 최대 70만원 납입, 정부 기여금 + 비과세", link:"https://www.kinfa.or.kr", cond:(age,income)=>age>=19&&age<=34&&income>=1&&income<=7 },
  { id:"hatssal", name:"햇살론 유스", desc:"저신용·저소득 청년 대상 연 3.5% 저금리 대출", link:"https://www.kinfa.or.kr", cond:(age,income)=>age>=19&&age<=34&&income<=3 },
  { id:"house-support", name:"청년 주택드림 청약통장", desc:"소득공제 + 우대금리 청약 통장", link:"https://nhuf.molit.go.kr", cond:(age,income)=>age>=19&&age<=34&&income<=5 },
  { id:"basic-pension", name:"기초연금", desc:"월 최대 33만 4,810원 지급 (2025년 기준)", link:"https://basicpension.mohw.go.kr", cond:(age,income)=>age>=65&&income<=7 },
  { id:"housing-benefit", name:"주거급여", desc:"임차가구 월세 지원 또는 자가가구 수선비 지원", link:"https://www.hb.go.kr", cond:(age,income)=>income<=5 },
  { id:"edu-benefit", name:"교육급여", desc:"초·중·고 학생 교육활동지원비 지급 (연 최대 65.4만원)", link:"https://www.bokjiro.go.kr", cond:(age,income)=>income<=3 },
  { id:"child-allowance", name:"아동수당", desc:"만 8세 미만 아동 월 10만원 지급", link:"https://www.childallowance.go.kr", cond:(age)=>age<9 },
  { id:"unemployment", name:"실업급여", desc:"퇴직 전 임금의 60%, 최소 90일 지급", link:"https://www.ei.go.kr", cond:(age,income)=>income>=1 },
  { id:"health-check", name:"국가 건강검진", desc:"2년마다 무료 건강검진 (짝수·홀수년 생)", link:"https://www.nhis.or.kr", cond:()=>true },
];

const S = {
  page: { minHeight:"100vh", background:"#FAFFFD", fontFamily:"'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif" },
  header: { background:"#fff", borderBottom:"1px solid #e8f0fb", position:"sticky", top:0, zIndex:20 },
  headerInner: { maxWidth:960, margin:"0 auto", padding:"0 24px", height:56, display:"flex", alignItems:"center", gap:16 },
  logo: { display:"flex", alignItems:"center", gap:8, textDecoration:"none" },
  logoMark: { display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, background:"#3C91E6", color:"#fff", borderRadius:7, fontSize:12, fontWeight:700 },
  main: { maxWidth:960, margin:"0 auto", padding:"32px 24px 80px" },
  card: { background:"#fff", border:"1.5px solid #e8f0fb", borderRadius:20, padding:32, boxShadow:"0 4px 24px rgba(60,145,230,0.08)", marginBottom:32 },
  field: { marginBottom:20 },
  label: { fontSize:13, fontWeight:700, color:"#334155", marginBottom:8, display:"block" },
  input: { width:"100%", padding:"11px 14px", border:"1.5px solid #b3d4f5", borderRadius:10, fontSize:15, fontFamily:"inherit", color:"#0f172a", outline:"none", background:"#FAFFFD", boxSizing:"border-box" },
  selectRow: { display:"flex", flexWrap:"wrap", gap:8 },
  selectBtn: (active) => ({ padding:"8px 14px", borderRadius:10, border: active?"1.5px solid #3C91E6":"1.5px solid #e2e8f0", background: active?"#e8f3fd":"#fff", color: active?"#3C91E6":"#475569", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.15s" }),
  typeBtn: (active) => ({ flex:1, padding:"10px 14px", borderRadius:12, border: active?"2px solid #3C91E6":"1.5px solid #e2e8f0", background: active?"#e8f3fd":"#fff", color: active?"#3C91E6":"#475569", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600, transition:"all 0.15s", minWidth:120 }),
  runBtn: (disabled) => ({ width:"100%", padding:14, background: disabled?"#94a3b8":"#3C91E6", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor: disabled?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s", marginTop:8 }),
  resultHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20, paddingBottom:16, borderBottom:"1px solid #e8f0fb" },
  resultTitle: { fontSize:15, fontWeight:700, color:"#0f172a" },
  resultCount: { fontSize:14, color:"#3C91E6", fontWeight:600 },
  resultItem: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"16px 20px", background:"#fff", border:"1px solid #e8f0fb", borderRadius:12, marginBottom:10, transition:"all 0.15s" },
  resultName: { fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:4 },
  resultDesc: { fontSize:13, color:"#64748b", lineHeight:1.5 },
  applyBtn: { padding:"7px 16px", background:"#e8f3fd", color:"#3C91E6", border:"1.5px solid #b3d4f5", borderRadius:20, fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s" },
  resetBtn: { width:"100%", padding:"12px", background:"#fff", border:"1.5px solid #b3d4f5", borderRadius:12, fontSize:14, fontWeight:700, color:"#3C91E6", cursor:"pointer", fontFamily:"inherit", marginTop:16 },
  hint: { fontSize:11, color:"#94a3b8", marginTop:6 },
  appGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:10 },
  appCard: { display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", background:"#fff", border:"1.5px solid #e8f0fb", borderRadius:12, textDecoration:"none", transition:"all 0.15s" },
  appIcon: { fontSize:22, flexShrink:0 },
  appLabel: { fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:2 },
  appDesc: { fontSize:12, color:"#94a3b8", lineHeight:1.4 },
};

export default function SupportPage() {
  const [checkAge, setCheckAge] = useState("");
  const [checkIncome, setCheckIncome] = useState("");
  const [checkHouse, setCheckHouse] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checkDone, setCheckDone] = useState(false);

  const runCheck = () => {
    const age = parseInt(checkAge), income = parseInt(checkIncome);
    if (!age || !income || !checkHouse) return;
    setCheckResult(GOV_SUPPORTS.filter(s => s.cond(age, income, checkHouse)));
    setCheckDone(true);
  };
  const disabled = !checkAge || !checkIncome || !checkHouse;

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link href="/" style={S.logo}>
            <span style={S.logoMark}>온</span>
            <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>온변</span>
          </Link>
          <span style={{ color:"#cbd5e1" }}>›</span>
          <span style={{ fontSize:14, color:"#475569", fontWeight:600 }}>정부지원</span>
          <Link href="/doc" style={{ marginLeft:"auto", padding:"7px 16px", background:"#3C91E6", color:"#fff", borderRadius:20, fontSize:13, fontWeight:700, textDecoration:"none" }}>
            전체 문서 보기
          </Link>
        </div>
      </header>

      <main style={S.main}>
        <h1 style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.5px", marginBottom:8 }}>정부지원 퀵체커</h1>
        <p style={{ fontSize:15, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>나이·소득·주거 3가지 입력으로 받을 수 있는 지원금을 확인하세요.</p>

        <div style={S.card}>
          {!checkDone ? (
            <>
              <div style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:24 }}>간단한 정보를 입력해주세요</div>

              {/* 나이 */}
              <div style={S.field}>
                <label style={S.label}>나이 (만 나이)</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="예: 27"
                  value={checkAge}
                  onChange={e => setCheckAge(e.target.value)}
                  onFocus={e => { e.target.style.borderColor="#3C91E6"; e.target.style.boxShadow="0 0 0 3px rgba(60,145,230,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor="#b3d4f5"; e.target.style.boxShadow="none"; }}
                />
              </div>

              {/* 소득분위 */}
              <div style={S.field}>
                <label style={S.label}>연소득 분위 (1~10분위)</label>
                <div style={S.selectRow}>
                  {[
                    {v:1,income:"~1,200만"},
                    {v:2,income:"~2,400만"},
                    {v:3,income:"~3,600만"},
                    {v:4,income:"~4,800만"},
                    {v:5,income:"~6,000만"},
                    {v:6,income:"~7,200만"},
                    {v:7,income:"~8,400만"},
                    {v:8,income:"~1억"},
                    {v:9,income:"~1.3억"},
                    {v:10,income:"1.3억+"},
                  ].map(({v,income}) => (
                    <button key={v} style={S.selectBtn(checkIncome===String(v))} onClick={() => setCheckIncome(String(v))}>
                      <span style={{ display:"block", fontWeight:700 }}>{v}분위</span>
                      <span style={{ fontSize:11, color:"inherit", opacity:0.8 }}>{income}</span>
                    </button>
                  ))}
                </div>
                <p style={S.hint}>1분위 = 하위 10% · 5분위 = 중간(연 ~6,000만원) · 10분위 = 상위 10%</p>
              </div>

              {/* 주거 형태 */}
              <div style={S.field}>
                <label style={S.label}>현재 주거 형태</label>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    {id:"renter", label:"🏠 임차인 (전·월세)"},
                    {id:"owner",  label:"🏡 자가 소유"},
                    {id:"other",  label:"🏢 기타 (기숙사·가족)"},
                  ].map(t => (
                    <button key={t.id} style={S.typeBtn(checkHouse===t.id)} onClick={() => setCheckHouse(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button style={S.runBtn(disabled)} onClick={runCheck} disabled={disabled}>
                받을 수 있는 지원 확인하기 →
              </button>
            </>
          ) : (
            <>
              <div style={S.resultHeader}>
                <div>
                  <div style={S.resultTitle}>
                    만 {checkAge}세 · {checkIncome}분위 · {checkHouse==="renter"?"임차인":checkHouse==="owner"?"자가":"기타"} 기준
                  </div>
                  <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>신청 전 공식 사이트에서 최신 조건을 반드시 확인하세요</div>
                </div>
                <div style={S.resultCount}>총 <strong>{checkResult?.length || 0}개</strong> 해당</div>
              </div>

              {checkResult?.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8", fontSize:15 }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                  현재 입력한 조건으로 해당되는 지원을 찾지 못했습니다.
                </div>
              ) : (
                <div>
                  {checkResult?.map(s => (
                    <div key={s.id} style={S.resultItem}>
                      <div>
                        <div style={S.resultName}>{s.name}</div>
                        <div style={S.resultDesc}>{s.desc}</div>
                      </div>
                      <a href={s.link} target="_blank" rel="noopener noreferrer" style={S.applyBtn}>
                        신청하기 →
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop:16, padding:"12px 16px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, fontSize:12, color:"#78350f" }}>
                ⚠️ 지원 조건은 정책 변경에 따라 달라질 수 있습니다. 신청 전 공식 사이트에서 최신 내용을 반드시 확인하세요.
              </div>
              <button style={S.resetBtn} onClick={() => { setCheckDone(false); setCheckResult(null); }}>
                다시 확인하기
              </button>
            </>
          )}
        </div>

        {/* 신청 서류 안내 */}
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:6 }}>신청 서류 안내</h2>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:16 }}>정부지원별 필요 서류를 미리 확인하세요.</p>
          <div style={S.appGrid}>
            {APPLICATIONS.map(app => (
              <Link key={app.id} href={`/doc/${app.id}`} style={S.appCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#3C91E6"; e.currentTarget.style.background="#e8f3fd"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e8f0fb"; e.currentTarget.style.background="#fff"; e.currentTarget.style.transform="none"; }}
              >
                <span style={S.appIcon}>{app.icon}</span>
                <div>
                  <div style={S.appLabel}>{app.label}</div>
                  <div style={S.appDesc}>{app.summary}</div>
                </div>
              </Link>
            ))}
          </div>
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
