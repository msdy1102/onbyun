// app/privacy/page.js — 개인정보처리방침
import TermsLayout from "../terms/TermsLayout";
import styles from "../terms/terms.module.css";

export const metadata = {
  title: "개인정보처리방침 | 온변",
  description: "온변 개인정보처리방침을 확인하세요.",
};

export default function PrivacyPage() {
  return (
    <TermsLayout current="/privacy">
      <h1 className={styles.pageTitle}>개인정보처리방침</h1>
      <p className={styles.updateDate}>최종 업데이트: 2025년 3월 1일</p>
      <span className={styles.effectiveDate}>시행일: 2025년 3월 1일</span>

      <p>
        온변(이하 "서비스")은 개인정보보호법 등 관련 법령을 준수하며, 이용자의 개인정보를
        소중히 보호합니다. 본 방침은 서비스가 수집하는 개인정보의 종류, 수집 목적, 이용 방법,
        보호 조치 등을 안내합니다.
      </p>

      <h2>1. 수집하는 개인정보 항목</h2>

      <h3>1.1 회원 가입 시 (Google 로그인)</h3>
      <div className={styles.infoBox}>
        <strong>필수 수집 항목</strong><br />
        Google 계정 ID, 이메일 주소, 이름, 프로필 사진 URL<br /><br />
        <strong>자동 수집 항목</strong><br />
        로그인 일시, 서비스 이용 기록, IP 주소(보안 및 어뷰징 방지 목적)
      </div>

      <h3>1.2 서비스 이용 시</h3>
      <div className={styles.infoBox}>
        <strong>AI 분석 이용 시</strong><br />
        분석한 계약서 유형, 분석 결과(위험도, 요약), 분석 일시<br />
        ※ 업로드한 계약서 원본 파일은 분석 즉시 서버에서 삭제되며, 저장되지 않습니다.<br /><br />
        <strong>결제 시</strong><br />
        주문번호, 결제 플랜, 결제 금액, 결제 일시<br />
        ※ 카드 번호 등 결제 수단 정보는 토스페이먼츠가 직접 처리하며, 서비스가 저장하지 않습니다.
      </div>

      <h2>2. 개인정보 수집 목적</h2>
      <ol>
        <li><strong>회원 관리</strong>: 서비스 로그인, 본인 확인, 이용 제한 관리</li>
        <li><strong>서비스 제공</strong>: AI 분석 이용 횟수 관리, 분석 내역 저장 및 조회</li>
        <li><strong>결제 처리</strong>: 유료 플랜 구독 관리, 결제 확인 및 환불 처리</li>
        <li><strong>서비스 개선</strong>: 이용 통계 분석, 서비스 품질 향상</li>
        <li><strong>보안 및 어뷰징 방지</strong>: 비정상적인 이용 감지 및 제한</li>
        <li><strong>법적 의무 이행</strong>: 관련 법령에 따른 기록 보관</li>
      </ol>

      <h2>3. 개인정보 보유 및 이용 기간</h2>

      <div className={styles.infoBox}>
        <strong>회원 정보</strong>: 탈퇴 시 즉시 삭제 (단, 법령에 따라 보관 의무가 있는 경우 해당 기간)<br />
        <strong>분석 내역</strong>: 무료 플랜 — 무기한 / 스탠다드 — 30일 / 프로 — 무기한<br />
        <strong>결제 정보</strong>: 5년 (전자상거래법에 따른 보관 의무)<br />
        <strong>불편사항 접수</strong>: 1년 (서비스 개선 목적)<br />
        <strong>IP 주소 (어뷰징 방지)</strong>: 1년
      </div>

      <h2>4. 개인정보의 제3자 제공</h2>
      <p>
        서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
        다만, 다음의 경우에는 예외적으로 제공될 수 있습니다.
      </p>
      <ol>
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령에 따라 수사기관 등이 요청하는 경우</li>
      </ol>

      <h2>5. 개인정보 처리 위탁</h2>
      <div className={styles.infoBox}>
        <strong>Supabase Inc.</strong> (미국)<br />
        위탁 목적: 데이터베이스 저장 및 관리<br />
        보유 기간: 회원 탈퇴 시 또는 위탁 계약 종료 시까지<br /><br />
        <strong>Anthropic PBC</strong> (미국)<br />
        위탁 목적: AI 계약서 분석 처리<br />
        보유 기간: 분석 처리 완료 즉시 (저장 없음)<br /><br />
        <strong>토스페이먼츠 주식회사</strong> (대한민국)<br />
        위탁 목적: 결제 처리 및 관리<br />
        보유 기간: 전자상거래법에 따른 보관 기간
      </div>

      <h2>6. 개인정보의 국외 이전</h2>
      <p>
        서비스는 Supabase(미국), Anthropic(미국)에 일부 개인정보를 이전합니다.
        각 업체는 적절한 보호 조치(표준 계약 조항 등)를 갖추고 있습니다.
      </p>

      <h2>7. 이용자의 권리</h2>
      <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
      <ol>
        <li><strong>열람권</strong>: 본인의 개인정보 처리 현황 열람 요청</li>
        <li><strong>정정권</strong>: 부정확한 개인정보의 수정 요청</li>
        <li><strong>삭제권</strong>: 개인정보의 삭제 요청 (단, 법령에 따라 보관이 필요한 경우 제외)</li>
        <li><strong>처리정지권</strong>: 개인정보 처리의 정지 요청</li>
      </ol>
      <p>
        권리 행사는 서비스 내 계정 설정 또는 contact@onbyun.com으로 요청하시기 바랍니다.
        요청은 접수일로부터 10일 이내에 처리됩니다.
      </p>

      <h2>8. 개인정보 보호 조치</h2>
      <ol>
        <li><strong>암호화 전송</strong>: 모든 데이터는 HTTPS(TLS 1.2 이상)로 암호화 전송</li>
        <li><strong>접근 제어</strong>: Row Level Security(RLS)로 본인 데이터만 접근 가능</li>
        <li><strong>최소 수집</strong>: 서비스 제공에 필요한 최소한의 정보만 수집</li>
        <li><strong>보안 헤더</strong>: X-Frame-Options, HSTS 등 보안 헤더 적용</li>
        <li><strong>소스맵 비공개</strong>: 프로덕션 환경에서 소스맵 비공개 처리</li>
      </ol>

      <h2>9. 쿠키 정책</h2>
      <ol>
        <li>서비스는 로그인 상태 유지를 위해 세션 쿠키를 사용합니다.</li>
        <li>쿠키는 브라우저 설정에서 삭제 또는 거부할 수 있으나, 거부 시 로그인이 필요한 기능을 이용할 수 없습니다.</li>
        <li>Google Analytics 등 서드파티 분석 쿠키는 사용하지 않습니다.</li>
      </ol>

      <h2>10. 개인정보 보호책임자</h2>
      <div className={styles.infoBox}>
        <strong>개인정보 보호책임자</strong><br />
        성명: 온변 운영팀<br />
        이메일: contact@onbyun.com<br />
        처리 기간: 접수일로부터 10일 이내<br /><br />
        개인정보 침해에 관한 신고 또는 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다.<br />
        · 개인정보보호위원회: privacy.go.kr / 국번 없이 182<br />
        · 한국인터넷진흥원 개인정보침해신고센터: privacy.kisa.or.kr / 국번 없이 118
      </div>

      <h2>11. 방침의 변경</h2>
      <p>
        본 개인정보처리방침은 법령 변경 또는 서비스 변경에 따라 업데이트될 수 있습니다.
        변경 시 시행일 7일 전에 서비스 내 공지사항을 통해 안내합니다.
        중요한 변경의 경우 이메일로 개별 통지합니다.
      </p>
    </TermsLayout>
  );
}
