"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./DocPage.module.css";

const LEVEL_CONFIG = {
  danger: { label: "위험", bg: "#fff1f1", border: "#ffcccc", text: "#c00000", dot: "#e03535" },
  warn:   { label: "주의", bg: "#fffbee", border: "#ffe5a0", text: "#7a5000", dot: "#d08600" },
  info:   { label: "확인", bg: "#eef2fd", border: "#c5d4f5", text: "#2d5bbf", dot: "#5385E4" },
};

const TOP3_DATA = {
  labor: [
    { title: "주휴수당 미포함", case: "주 20시간 알바인데 주휴수당 언급 없어 1년간 미청구 → 100만 원 이상 손해." },
    { title: "수습기간 급여 삭감 조항", case: "수습 3개월 최저임금 90% 적용이라 써있어 당연한 줄 알았지만, 단순 업무는 삭감 불가." },
    { title: "퇴직금 미언급", case: "1년 이상 알바 후 퇴직금 요구했더니 '계약서에 없다'며 거부 → 법적으로는 당연히 발생." },
  ],
  "labor-flex-5up": [
    { title: "코어타임·재택 범위 미명시", case: "재택 가능하다고 구두 약속받았지만 계약서에 없어 출근 강요 시 대응 불가." },
    { title: "연장근무 수당 기준 불명확", case: "탄력근무 특성상 연장 기준 모호해 실제 초과분 미지급 사례 빈번." },
    { title: "성과 평가 기준 부재", case: "재택 성과 기준 없이 일방적 인사 조치 시 이의 제기 어려움." },
  ],
  "labor-15up-5up": [
    { title: "주휴수당 계산 방식 누락", case: "시급 10,030원인데 주휴수당 항목이 빠져 월급 차이 수십만 원 발생." },
    { title: "연장·야간 수당 가산율 미기재", case: "야간 근무 많은데 가산 50% 미기재 → 분쟁 시 입증 어려움." },
    { title: "해고예고 기간 미명시", case: "갑작스러운 해고 통보 후 30일치 예고수당 청구했지만 계약서 근거 없음." },
  ],
  lease: [
    { title: "확정일자 효력 개시 시점 착각", case: "잔금 당일 오전 담보대출이 먼저 설정돼 보증금 3,000만 원 후순위로 밀린 사례." },
    { title: "특약사항 없이 수리 책임 모호", case: "'현 상태 인도' 문구 하나로 입주 후 누수·결로 수리비 세입자 전가." },
    { title: "묵시적 갱신 기간 착각", case: "계약 만료 2개월 전 미통보 → 자동 갱신으로 1년 더 거주 의무 발생." },
  ],
  freelance: [
    { title: "IP 전면 귀속 조항", case: "디자이너가 1년간 작업한 결과물을 모두 클라이언트 소유로 등록, 포트폴리오 사용도 불가." },
    { title: "수정 횟수 무제한 허용", case: "'합리적 수정 요청'이란 표현 하나로 수십 차례 수정 후 대금 미지급 분쟁." },
    { title: "지급 조건 불명확", case: "검수 후 14일 이내 지급이라 했지만 검수 기준 없어 6개월 이상 지연." },
  ],
  employment: [
    { title: "경업금지 범위 과도", case: "퇴직 후 2년간 동종업계 취업 금지 조항 → 법적 효력 제한적이나 심리적 압박 유발." },
    { title: "비밀유지 범위 무제한", case: "'모든 업무 관련 정보'를 영구 비밀 유지하라는 조항 → 경력 입증 곤란." },
    { title: "인센티브 지급 기준 없음", case: "구두로 약속한 성과급을 계약서에 미기재 → 미지급 시 청구 근거 없음." },
  ],
  "youth-rent": [
    { title: "전입신고 완료 여부 미확인", case: "신청 당시 전입신고가 안 돼 있어 서류 반려 → 지원 기간 놓침." },
    { title: "부모와 주민등록 미분리", case: "부모 집에 등본이 남아있어 '독립 거주' 요건 미충족으로 탈락." },
    { title: "건강보험료 납부 확인서 발급 시점", case: "최신 납부 확인서가 필요한데 1개월 전 발급본 제출 → 재신청 필요." },
  ],
  "policy-loan": [
    { title: "임대차계약서 확정일자 미비", case: "계약서에 확정일자 없어 대출 심사 탈락 → 재계약 수수료 발생." },
    { title: "잔금 전 대출 신청 타이밍 미스", case: "잔금 치른 뒤 신청해 버팀목 대출 소급 불가." },
    { title: "무직자의 소득 증빙 누락", case: "취준 중이라 고용보험 가입이력내역서 제출해야 하는데 모르고 방문 → 헛걸음." },
  ],
  "youth-savings": [
    { title: "가입 신청 기간 미확인", case: "매월 특정 기간에만 신청 가능한데 기간 지나 다음달 대기." },
    { title: "직전 과세연도 소득 확인 누락", case: "올해 취업했어도 직전 연도 소득으로 판단 → 예상과 다른 기여금 책정." },
    { title: "중도 해지 시 비과세 혜택 소멸", case: "3년 후 해지하면 정부 기여금·비과세 혜택 모두 반환 → 손해 발생." },
  ],
  "health-checkup": [
    { title: "검진 대상 연도 착각", case: "홀수 년생인데 짝수 해에 예약해 검진 불가 → 1년 대기." },
    { title: "공복 8시간 미준수", case: "검진 당일 오전에 커피 마시고 방문 → 혈당·혈중지질 검사 재검 필요." },
    { title: "암검진 대상자 별도 확인 미이행", case: "위암 검진 대상인데 모르고 기본 검진만 받아 추가 검사 기회 놓침." },
  ],
  "unemployment": [
    { title: "퇴직 후 12개월 내 미신청", case: "이직 준비하다 1년 지나 수급 자격 소멸 → 수백만 원 수급 기회 소멸." },
    { title: "이직확인서 발급 지연", case: "전 직장에서 이직확인서 발급 미이행 → 신청 자체 불가 상태 장기화." },
    { title: "구직활동 미이행으로 수급 정지", case: "수급 중 구직활동 신고 잊어 수급 정지 처분." },
  ],
  "basic-pension": [
    { title: "소득인정액 계산 착오", case: "금융재산·부동산 환산액 포함 후 기준 초과 → 신청 후 탈락 통보." },
    { title: "배우자 금융정보 동의 누락", case: "배우자 금융정보 동의서 미첨부로 서류 반려 → 재방문." },
    { title: "자동차 재산 환산 미인지", case: "차량 소유로 소득인정액 상승 → 단독가구 기준 초과 탈락." },
  ],
  "housing-benefit": [
    { title: "임대인 통장 사본 누락", case: "임대료 지급 증빙 불가 → 지급 지연." },
    { title: "중위소득 기준 오해", case: "48% 기준을 연 소득으로 착각 → 소득인정액 방식과 달라 탈락." },
    { title: "자가가구의 수선급여 신청 미인지", case: "집 있어도 수선급여 받을 수 있는데 몰라 수십만 원 놓침." },
  ],
  "edu-benefit": [
    { title: "학생증으로 재학 미입증", case: "학생증만 제출하고 재학증명서 미첨부 → 서류 보완 요청." },
    { title: "교육활동지원비 바우처 사용처 오해", case: "바우처를 현금처럼 쓸 수 있다고 착각 → 사용 불가 가맹점에서 결제 시도." },
    { title: "가구원 소득 합산 기준 미파악", case: "본인 소득만 보면 될 줄 알았는데 가구 전체 소득인정액 적용." },
  ],
  "child-allowance": [
    { title: "출생신고 지연으로 소급 제한", case: "출생 후 2개월 만에 신고 → 최대 소급 기간 적용 불가." },
    { title: "통장 명의 혼동", case: "아동 명의 통장 없어 부모 명의로 신청 → 지급 지연." },
    { title: "주민등록 미등재 아동", case: "해외 거주 후 귀국 시 주민등록 등재 전 신청 → 반려." },
  ],
};

const GUIDE_DATA = {
  labor: {
    title: "근로계약 관련 분쟁",
    situations: [
      {
        situation: "임금·수당을 받지 못했을 때",
        steps: [
          "증거 수집 — 근로계약서, 급여명세서, 근무일지, 문자·카톡 기록 저장",
          "고용노동부 신고 — 고용24(work24.go.kr) 또는 관할 고용노동청 방문. 임금체불 진정서 제출",
          "법적 조치 — 미지급 3개월치 이상이면 소액심판 또는 지급명령 신청 (비용 없음). 미지급 임금은 퇴직 후 3년 내 청구 가능",
        ],
      },
      {
        situation: "부당해고·권고사직을 강요받았을 때",
        steps: [
          "증거 수집 — 해고 통보 문자·메일, 녹음, 목격자 확보. 자발적 퇴사로 처리되지 않도록 주의",
          "노동위원회 구제 신청 — 해고일로부터 3개월 이내 관할 지방노동위원회에 부당해고 구제 신청",
          "실업급여 확인 — 권고사직은 비자발적 퇴직으로 실업급여 수급 가능. 이직확인서 발급 요청 필수",
        ],
      },
      {
        situation: "계약서를 써주지 않거나 교부를 거부할 때",
        steps: [
          "내용증명 발송 — 근로계약서 교부 요청 내용증명 발송 (우체국 또는 전자 내용증명)",
          "고용노동부 신고 — 근로계약서 미작성·미교부는 500만 원 이하 벌금 대상. 고용24에서 진정 신고",
          "증거 보완 — 계약서 없어도 급여이체내역, 출퇴근 기록으로 근로 사실 입증 가능",
        ],
      },
    ],
    contact: { name: "고용노동부 고객상담센터", tel: "1350", link: "https://www.work24.go.kr" },
  },
  lease: {
    title: "임대차 계약 분쟁",
    situations: [
      {
        situation: "전세보증금을 돌려받지 못할 때",
        steps: [
          "내용증명 발송 — 계약 만료일 1개월 전, 보증금 반환 요청 내용증명 발송 (반드시 기록 남기기)",
          "임차권 등기 명령 신청 — 만기 후 이사하면서도 대항력 유지. 관할 법원에 임차권등기명령 신청 (비용 약 2만 원)",
          "법적 조치 — HUG 전세보증보험 가입자는 보험사 대위변제 청구. 미가입자는 지급명령·보증금반환청구 소송 진행",
        ],
      },
      {
        situation: "집주인이 계약 중 무단으로 담보대출을 설정할 때",
        steps: [
          "등기부 즉시 확인 — 인터넷 등기소에서 실시간 확인. 근저당 설정 사실 문서화",
          "계약서 특약 확인 — '담보대출 금지' 특약이 있으면 계약 해제 및 보증금 반환 요구 가능",
          "법률구조공단 상담 — 대한법률구조공단(132) 무료 법률 상담 후 소송 여부 결정",
        ],
      },
      {
        situation: "집주인이 수리를 거부할 때",
        steps: [
          "서면 요청 — 수리 요청 문자·내용증명 발송 후 2주 이상 무응답 시 증거 보관",
          "임차인 자체 수선 권리 — 소액 수리(50만 원 미만)는 임차인이 하고 비용 청구 가능 (민법 제626조)",
          "분쟁조정위원회 — 주택임대차분쟁조정위원회(1670-0508)에 무료 조정 신청",
        ],
      },
    ],
    contact: { name: "주택임대차분쟁조정위원회", tel: "1670-0508", link: "https://www.molit.go.kr" },
  },
  freelance: {
    title: "프리랜서 계약 분쟁",
    situations: [
      {
        situation: "대금을 지급받지 못했을 때",
        steps: [
          "증거 수집 — 계약서, 작업 파일, 납품 이메일, 카톡 대화 전체 스크린샷 저장",
          "내용증명 발송 — 지급 기한을 명시한 대금 청구 내용증명 발송",
          "소액심판 신청 — 3,000만 원 이하는 법원 소액심판 신청 (접수비 약 1만 원). 본인 직접 진행 가능",
        ],
      },
      {
        situation: "IP(저작권)을 무단으로 사용당했을 때",
        steps: [
          "침해 증거 확보 — 무단 사용 웹페이지 캡처, URL, 날짜 기록. 화면녹화로 증거력 강화",
          "저작권 위원회 조정 — 한국저작권위원회(1400) 분쟁조정 신청. 무료이며 60일 내 처리",
          "민·형사 조치 — 고의성 명백하면 저작권법 위반 형사 고소 가능. 손해배상 청구 병행",
        ],
      },
      {
        situation: "무리한 수정 요구·계약 중도 해지를 당할 때",
        steps: [
          "계약서 조항 확인 — 수정 횟수·범위·해지 조건 조항 파악. 해당 없으면 초과분 청구 근거",
          "서면으로 이의 제기 — 구두 요구에 응하지 말고 이메일로 요청 내역 서면화 요청",
          "예술인권리보장법 확인 — 예술인 대상 적용 여부 확인 (예술인복지재단 1899-0132)",
        ],
      },
    ],
    contact: { name: "예술인복지재단", tel: "1899-0132", link: "https://www.kawf.kr" },
  },
  employment: {
    title: "취업·위촉 계약 분쟁",
    situations: [
      {
        situation: "경업금지 조항 위반으로 소송 위협을 받을 때",
        steps: [
          "조항 효력 검토 — 기간 2년 초과·지역 무제한·보상 없는 조항은 무효 가능성 높음",
          "법률 전문가 상담 — 대한법률구조공단(132) 무료 상담. 무효 사유 근거 확인",
          "소송 대응 — 상대방이 소송 제기 시 조항 무효 항변 준비. 실제 영업 비밀 침해 없으면 인용 어려움",
        ],
      },
      {
        situation: "인센티브·성과급을 지급받지 못할 때",
        steps: [
          "지급 근거 확인 — 계약서·취업규칙·이메일·사내공문 등에서 지급 기준 문서화",
          "고용노동부 진정 — 임금 성격의 인센티브는 임금 체불로 신고 가능 (고용24 또는 1350)",
          "민사 청구 — 계약서에 기재된 성과급은 계약 이행 소송으로 청구 가능",
        ],
      },
      {
        situation: "수습기간 후 본채용 거부를 당했을 때",
        steps: [
          "사유 서면 요청 — 거부 사유를 서면으로 요청. 정당한 이유 없으면 부당해고에 준하는 구제 신청",
          "노동위원회 구제 — 3개월 수습 후 거부는 해고에 준하는 판례 다수. 지방노동위원회에 구제 신청",
          "증거 수집 — 수습 중 평가 기록, 칭찬 메일, 업무 완수 증거로 성과 입증",
        ],
      },
    ],
    contact: { name: "고용노동부 고객상담센터", tel: "1350", link: "https://www.work24.go.kr" },
  },
  "youth-rent": {
    title: "청년 월세 지원 관련",
    situations: [
      {
        situation: "신청 후 서류 보완 요청을 받았을 때",
        steps: [
          "안내문 내용 정확히 확인 — LH 마이홈 포털 로그인 후 '신청현황'에서 보완 사유 확인",
          "기한 내 재제출 — 보완 요청 기한(보통 7~14일) 내 재제출. 기한 초과 시 접수 취소",
          "고객센터 문의 — LH 청약센터(1600-1004) 또는 마이홈 포털 1:1 문의 활용",
        ],
      },
      {
        situation: "지원 탈락 통보를 받았을 때",
        steps: [
          "탈락 사유 확인 — 소득 기준 초과, 주소 요건 미충족 등 구체적 사유 확인",
          "이의 신청 — 탈락 통보일로부터 30일 이내 LH 또는 지자체에 이의 신청 가능",
          "재신청 준비 — 다음 신청 주기에 요건 맞춰 재신청. 지자체별 별도 청년 월세 지원 동시 확인",
        ],
      },
    ],
    contact: { name: "LH 청약센터", tel: "1600-1004", link: "https://youth.myhome.go.kr" },
  },
  "unemployment": {
    title: "실업급여 관련",
    situations: [
      {
        situation: "이직확인서를 전 직장이 발급해주지 않을 때",
        steps: [
          "고용센터 직권 발급 요청 — 관할 고용센터에 직권 발급 요청. 사업주는 14일 이내 발급 의무",
          "고용노동부 신고 — 발급 거부 시 고용노동부(1350) 신고. 과태료 처분 가능",
          "피보험자격확인청구 — 고용보험 가입 이력만으로도 수급자격 확인 가능한 경우 있음",
        ],
      },
      {
        situation: "구직활동 인정이 안 돼 수급이 정지됐을 때",
        steps: [
          "인정 활동 기준 재확인 — 입사지원 2회 이상 또는 취업특강 수강 등 인정 기준 확인 (고용24 참조)",
          "이의 신청 — 수급 정지 통보 30일 이내 고용센터에 이의 신청. 정당한 사유 소명",
          "취업지원 프로그램 연계 — 고용센터 취업지원관 상담을 통해 인정 활동 계획 재수립",
        ],
      },
    ],
    contact: { name: "고용24 고객센터", tel: "1350", link: "https://www.work24.go.kr" },
  },
  "basic-pension": {
    title: "기초연금 관련",
    situations: [
      {
        situation: "소득인정액 산정이 잘못된 것 같을 때",
        steps: [
          "산정 내역서 요청 — 주민센터에서 소득인정액 산정 결과 내역서 열람·교부 신청",
          "이의 신청 — 결정 통지일로부터 90일 이내 관할 시·군·구청에 이의 신청 가능",
          "복지로 모의계산 활용 — 복지로 사이트에서 사전 모의 계산 후 신청 여부 판단",
        ],
      },
    ],
    contact: { name: "보건복지부 콜센터", tel: "129", link: "https://basicpension.mohw.go.kr" },
  },
  "child-allowance": {
    title: "아동수당 관련",
    situations: [
      {
        situation: "소급 지급이 안 됐을 때",
        steps: [
          "소급 기간 확인 — 출생일로부터 60일 이내 신청 시 출생일부터 소급. 초과 시 신청일 다음달부터 지급",
          "이의 신청 — 지급 결정에 이의 있으면 결정 통지일로부터 90일 이내 신청 기관에 이의 신청",
          "복지로 문의 — 복지로(1544-0000) 또는 주민센터 방문 상담",
        ],
      },
    ],
    contact: { name: "복지로 고객센터", tel: "1544-0000", link: "https://www.childallowance.go.kr" },
  },
};

function getTop3(id) {
  if (TOP3_DATA[id]) return TOP3_DATA[id];
  if (id.startsWith("labor")) return TOP3_DATA["labor"];
  if (id.startsWith("lease") || id.startsWith("realestate")) return TOP3_DATA["lease"];
  if (id.startsWith("freelance") || id.startsWith("service") || id.startsWith("creator")) return TOP3_DATA["freelance"];
  if (id.startsWith("employment")) return TOP3_DATA["employment"];
  return null;
}

function getGuide(id) {
  if (GUIDE_DATA[id]) return GUIDE_DATA[id];
  if (id.startsWith("labor")) return GUIDE_DATA["labor"];
  if (id.startsWith("lease") || id.startsWith("realestate")) return GUIDE_DATA["lease"];
  if (id.startsWith("freelance") || id.startsWith("service") || id.startsWith("creator")) return GUIDE_DATA["freelance"];
  if (id.startsWith("employment")) return GUIDE_DATA["employment"];
  return null;
}

function CheckItem({ item }) {
  const lc = LEVEL_CONFIG[item.lv] || LEVEL_CONFIG.info;
  return (
    <div className={styles.checkItem} style={{ background: lc.bg, borderColor: lc.border }}>
      <div className={styles.checkHeader}>
        <span className={styles.checkDot} style={{ background: lc.dot }} />
        <span className={styles.checkLevel} style={{ color: lc.text }}>{lc.label}</span>
        <span className={styles.checkTitle}>{item.title}</span>
      </div>
      <div className={styles.checkDesc}>{item.desc}</div>
    </div>
  );
}

function Top3Banner({ id, type }) {
  const items = getTop3(id);
  if (!items) return null;
  const bannerLabel = type === "application"
    ? "이 서류 신청에서 가장 많이 놓치는 항목 TOP 3"
    : "이 계약서에서 가장 많이 당하는 조항 TOP 3";
  return (
    <div className={styles.top3Banner}>
      <div className={styles.top3Title}>⚠️ {bannerLabel}</div>
      <div className={styles.top3List}>
        {items.map((item, i) => (
          <div key={i} className={styles.top3Item}>
            <span className={styles.top3Rank}>{i + 1}</span>
            <div className={styles.top3Content}>
              <div className={styles.top3Name}>{item.title}</div>
              <div className={styles.top3Case}>💬 실제 사례: {item.case}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideSection({ id }) {
  const guide = getGuide(id);
  const [openIdx, setOpenIdx] = useState(null);
  if (!guide) return null;
  return (
    <section className={styles.guideSection}>
      <h2 className={styles.sectionTitle}>이런 상황, 어떻게 하나요?</h2>
      <div className={styles.guideList}>
        {guide.situations.map((s, i) => (
          <div key={i} className={styles.guideItem}>
            <button
              className={`${styles.guideToggle} ${openIdx === i ? styles.guideToggleOpen : ""}`}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span className={styles.guideToggleIcon}>{openIdx === i ? "▲" : "▼"}</span>
              <span>{s.situation}</span>
            </button>
            {openIdx === i && (
              <div className={styles.guideSteps}>
                {s.steps.map((step, j) => {
                  const dashIdx = step.indexOf(" — ");
                  const label = dashIdx > -1 ? step.slice(0, dashIdx) : step;
                  const desc  = dashIdx > -1 ? step.slice(dashIdx + 3) : "";
                  return (
                    <div key={j} className={styles.guideStep}>
                      <span className={styles.guideStepNum}>{j + 1}</span>
                      <div className={styles.guideStepContent}>
                        <span className={styles.guideStepLabel}>{label}</span>
                        {desc && <span className={styles.guideStepDesc}>{desc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.guideContact}>
        <span className={styles.guideContactLabel}>📞 관련 기관</span>
        <a href={guide.contact.link} target="_blank" rel="noopener noreferrer" className={styles.guideContactLink}>
          {guide.contact.name} {guide.contact.tel}
        </a>
      </div>
    </section>
  );
}

export default function DocPage({ data }) {
  const { id, label, category, type, contract, application, detail } = data;

  const levelCount = detail ? {
    danger: detail.checklist.filter(c => c.lv === "danger").length,
    warn:   detail.checklist.filter(c => c.lv === "warn").length,
    info:   detail.checklist.filter(c => c.lv === "info").length,
  } : null;

  const handlePdfDownload = () => {
    window.print();
  };

  return (
    <div className={styles.page} id="docPageRoot">
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>온</span>
            <span className={styles.brandFull}>온라인 변호사</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navBtn}>홈</Link>
            <Link href="/app-service?tab=list" className={styles.navBtn}>전체 문서</Link>
            <Link href="/app-service?tab=calc" className={styles.navBtn}>계산기</Link>
            <Link href="/app-service?tab=support" className={styles.navBtn}>정부지원</Link>
            <Link href="/app-service?tab=ai" className={styles.navBtn}>AI 분석</Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {/* 브레드크럼 */}
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>홈</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link href="/app-service?tab=list" className={styles.breadcrumbLink}>전체 문서 목록</Link>
          {category && (
            <>
              <span className={styles.breadcrumbSep}>›</span>
              <span className={styles.breadcrumbCurrent}>{category}</span>
            </>
          )}
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{label}</span>
        </nav>

        {/* 문서 헤더 */}
        <div className={styles.docHeader}>
          <div className={styles.docMeta}>
            {category && <span className={styles.docCategory}>{category}</span>}
            <span className={styles.docType}>
              {type === "contract" ? "계약서 주의사항" : type === "application" ? "신청 서류 안내" : "법률 문서"}
            </span>
          </div>
          <div className={styles.docTitleRow}>
            <h1 className={styles.docTitle}>{label}</h1>
            <button className={styles.pdfBtn} onClick={handlePdfDownload} title="PDF로 저장">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF 저장
            </button>
          </div>
          {(contract?.summary || application?.summary) && (
            <p className={styles.docSummary}>{contract?.summary || application?.summary}</p>
          )}
          {levelCount && (
            <div className={styles.levelSummary}>
              {levelCount.danger > 0 && (
                <div className={styles.levelBadge} style={{ background: "#fff1f1", color: "#c00000", border: "1px solid #ffcccc" }}>
                  위험 {levelCount.danger}개
                </div>
              )}
              {levelCount.warn > 0 && (
                <div className={styles.levelBadge} style={{ background: "#fffbee", color: "#7a5000", border: "1px solid #ffe5a0" }}>
                  주의 {levelCount.warn}개
                </div>
              )}
              {levelCount.info > 0 && (
                <div className={styles.levelBadge} style={{ background: "#eef2fd", color: "#2d5bbf", border: "1px solid #c5d4f5" }}>
                  확인 {levelCount.info}개
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.content}>
          {type === "contract" && contract && (
            <>
              <Top3Banner id={id} type={type} />
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>체크리스트</h2>
                <div className={styles.checkList}>
                  {contract.checklist.map((c, i) => {
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
                  })}
                </div>
              </section>
              <GuideSection id={id} />
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>실전 팁</h2>
                <ul className={styles.tipList}>
                  {contract.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </section>
              {contract.link && (
                <a href={contract.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>
                  {contract.linkLabel} →
                </a>
              )}
            </>
          )}

          {type === "application" && application && (
            <>
              <Top3Banner id={id} type={type} />
              <div className={styles.freshnessWarn}>
                ⚠️ 정부 정책은 수시로 변경됩니다. 신청 전 반드시 공식 사이트에서 최신 내용을 확인하세요.
              </div>
              {application.condition && (
                <div className={styles.condition}>✓ 신청 조건: {application.condition}</div>
              )}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>필요 서류</h2>
                {application.docs.map((d, i) => (
                  <div key={i} className={styles.docGroup}>
                    <div className={styles.docCategory}>{d.category}</div>
                    <ul className={styles.docList}>
                      {d.items.map((item, j) => (
                        <li key={j} className={styles.docItem}>
                          <span className={styles.docBullet}>·</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
              <GuideSection id={id} />
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>주의사항</h2>
                <ul className={styles.tipList}>
                  {application.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </section>
              {application.link && (
                <a href={application.link} target="_blank" rel="noopener noreferrer" className={styles.extLink}>
                  {application.linkLabel} →
                </a>
              )}
            </>
          )}

          {type === "list" && (
            <>
              {detail ? (
                <>
                  <Top3Banner id={id} type={type} />
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>체크리스트</h2>
                    <div className={styles.checkList}>
                      {detail.checklist.map((c, i) => <CheckItem key={i} item={c} />)}
                    </div>
                  </section>
                  <GuideSection id={id} />
                  {detail.tips && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>실전 팁</h2>
                      <ul className={styles.tipList}>
                        {detail.tips.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </section>
                  )}
                </>
              ) : (
                <div className={styles.noDetail}>📌 상세 주의사항을 준비 중입니다. 곧 업데이트됩니다.</div>
              )}
            </>
          )}

          <div className={styles.disclaimer}>
            본 페이지의 정보는 일반적인 참고 목적으로 제공되며 법적 효력이 없습니다.
            중요한 계약은 반드시 전문 변호사와 상담하시기 바랍니다.
          </div>
          <div className={styles.aiCta}>
            <div className={styles.aiCtaLeft}>
              <div className={styles.aiCtaTitle}>🤖 실제 계약서를 분석하고 싶으신가요?</div>
              <div className={styles.aiCtaDesc}>계약서 내용을 붙여넣으면 AI가 위험 조항을 자동으로 찾아드려요.</div>
            </div>
            <Link href="/app-service?tab=ai" className={styles.aiCtaBtn}>AI 분석하기 →</Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.brandMark}>온</span>
            <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 8 }}>온라인 변호사</span>
          </div>
          <p className={styles.footerDisc}>본 사이트의 모든 정보는 참고용이며 법적 효력이 없습니다.</p>
          <p className={styles.footerCopy}>© 2025 온변. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
