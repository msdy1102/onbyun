"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CONTRACT_LIST, CONTRACT_CATEGORIES, CONTRACTS, APPLICATIONS } from "../data";

export default function DocListPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // 전체 아이템 통합
  const allItems = useMemo(() => {
    const items = [];
    CONTRACT_LIST.forEach(item => {
      const cat = CONTRACT_CATEGORIES.find(c => c.id === item.category);
      items.push({ ...item, catLabel: cat?.label || "", href: `/doc/${item.id}` });
    });
    CONTRACTS.forEach(item => {
      items.push({ ...item, catLabel: item.tag || "계약서", href: `/doc/${item.id}` });
    });
    APPLICATIONS.forEach(item => {
      items.push({ ...item, catLabel: item.tag || "정부지원", href: `/doc/${item.id}` });
    });
    return items;
  }, []);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || item.label.toLowerCase().includes(q) || item.catLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allItems, activeCategory, search]);

  // 카테고리별 그룹
  const grouped = useMemo(() => {
    if (activeCategory !== "all") {
      return { [activeCategory]: filtered };
    }
    const groups = {};
    filtered.forEach(item => {
      const key = item.category || "etc";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filtered, activeCategory]);

  const getCatLabel = (catId) => {
    const cat = CONTRACT_CATEGORIES.find(c => c.id === catId);
    return cat?.label || catId;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFFFD",
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* 헤더 */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e8f0fb",
        position: "sticky", top: 0, zIndex: 20,
        boxShadow: "0 1px 0 rgba(60,145,230,0.06)",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto", padding: "0 24px",
          height: 56, display: "flex", alignItems: "center", gap: 16,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, background: "#3C91E6", color: "#fff",
              borderRadius: 7, fontSize: 12, fontWeight: 700,
            }}>온</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>온변</span>
          </Link>
          <span style={{ color: "#cbd5e1", fontSize: 16 }}>›</span>
          <span style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>전체 문서</span>
          <Link href="/ai" style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 16px", background: "#3C91E6", color: "#fff",
            borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: "none",
            transition: "all 0.15s",
          }}>
            ✦ AI 분석
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* 페이지 타이틀 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 8 }}>
            전체 문서 목록
          </h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>
            121종 계약서 체크리스트 · 정부지원 서류 안내 — 전부 무료로 확인하세요.
          </p>
        </div>

        {/* 검색 */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="계약서명 또는 분야 검색..."
            style={{
              width: "100%", padding: "12px 14px 12px 42px", boxSizing: "border-box",
              border: "1.5px solid #b3d4f5", borderRadius: 12, fontSize: 15,
              fontFamily: "inherit", outline: "none", background: "#fff",
              color: "#0f172a", transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = "#3C91E6"; e.target.style.boxShadow = "0 0 0 3px rgba(60,145,230,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#b3d4f5"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {[{ id: "all", label: "전체" }, ...CONTRACT_CATEGORIES].map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: activeCategory === cat.id ? "1.5px solid #3C91E6" : "1.5px solid #e2e8f0",
              background: activeCategory === cat.id ? "#3C91E6" : "#fff",
              color: activeCategory === cat.id ? "#fff" : "#475569",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 결과 수 */}
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
          {filtered.length}개 문서
        </p>

        {/* 문서 그룹 */}
        {Object.entries(grouped).map(([catId, items]) => (
          <div key={catId} style={{ marginBottom: 36 }}>
            {activeCategory === "all" && (
              <h2 style={{
                fontSize: 13, fontWeight: 700, color: "#3C91E6",
                letterSpacing: "0.06em", textTransform: "uppercase",
                marginBottom: 12, paddingBottom: 8,
                borderBottom: "1px solid #e8f3fd",
              }}>
                {getCatLabel(catId)}
              </h2>
            )}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}>
              {items.map(item => (
                <Link key={item.id} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px",
                  background: "#fff",
                  border: "1.5px solid #e8f0fb",
                  borderRadius: 12,
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#3C91E6";
                  e.currentTarget.style.background = "#e8f3fd";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(60,145,230,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e8f0fb";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon || "📄"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.label}
                    </div>
                    {item.summary && (
                      <div style={{
                        fontSize: 12, color: "#94a3b8", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.summary}
                      </div>
                    )}
                  </div>
                  <svg style={{ color: "#b3d4f5", flexShrink: 0 }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", border: "1px solid #e8f0fb", borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 15, color: "#94a3b8" }}>
              "{search}"에 해당하는 문서가 없습니다.
            </p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{
        borderTop: "1px solid #e8f0fb", padding: "24px",
        background: "#fff", textAlign: "center",
      }}>
        <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
          본 사이트의 모든 정보는 참고용이며 법적 효력이 없습니다.<br/>
          © 2025 온변(Onbyun). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
