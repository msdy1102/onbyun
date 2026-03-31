// app/terms/TermsLayout.js — 약관 페이지 공통 레이아웃
import Link from "next/link";
import styles from "./terms.module.css";

const NAV_ITEMS = [
  { href: "/terms",         label: "이용약관" },
  { href: "/service-terms", label: "서비스약관" },
  { href: "/policy",        label: "운영 정책" },
  { href: "/privacy",       label: "개인정보처리방침" },
];

export default function TermsLayout({ children, current }) {
  return (
    <div className={styles.wrap}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>온</span>
            <span className={styles.brandName}>온변</span>
            <span className={styles.brandSub}>온라인 변호사</span>
          </Link>
          <Link href="/" className={styles.headerBack}>← 서비스로 돌아가기</Link>
        </div>
      </header>

      <div className={styles.container}>
        {/* 좌측 네비게이션 */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarTitle}>약관 및 정책</div>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item, i) => (
              <li
                key={item.href}
                className={`${styles.navItem} ${current === item.href ? styles.active : ""}`}
              >
                <Link href={item.href}>{item.label}</Link>
                {i === 0 && <div className={styles.navDivider} />}
              </li>
            ))}
          </ul>
        </nav>

        {/* 본문 */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
