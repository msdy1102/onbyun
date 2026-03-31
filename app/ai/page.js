"use client";

import { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

const RISK_COLORS = {
  danger: { label: "위험", bg: "#fff1f1", border: "#fca5a5", text: "#dc2626", dot: "#ef4444" },
  warn:   { label: "주의", bg: "#fffbeb", border: "#fde68a", text: "#d97706", dot: "#f59e0b" },
  info:   { label: "확인", bg: "#e8f3fd", border: "#b3d4f5", text: "#3C91E6", dot: "#3C91E6" },
};

export default function AIAnalysisPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("파일 크기는 10MB 이하여야 합니다."); return; }
    setFile(f);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !file) { setError("계약서 내용을 입력하거나 파일을 업로드해주세요."); return; }
    if (!isLoggedIn) { signIn("google"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (text.trim()) fd.append("text", text.trim());
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setResult(data);
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setText(""); setFile(null); setResult(null); setError(""); };

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
          maxWidth: 760, margin: "0 auto", padding: "0 24px",
          height: 56, display: "flex", alignItems: "center", gap: 16,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, background: "#3C91E6", color: "#fff",
              borderRadius: 7, fontSize: 12, fontWeight: 700,
            }}>온</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>온변</span>
          </Link>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>AI 계약서 분석</span>
          {isLoggedIn && (
            <Link href="/mypage" style={{
              marginLeft: "auto", fontSize: 13, color: "#3C91E6",
              textDecoration: "none", fontWeight: 600,
            }}>
              내 정보
            </Link>
          )}
          {!isLoggedIn && (
            <button onClick={() => signIn("google")} style={{
              marginLeft: "auto", padding: "6px 16px", background: "#3C91E6", color: "#fff",
              border: "none", borderRadius: 20, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              로그인
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#e8f3fd", border: "1px solid #b3d4f5", color: "#3C91E6",
            fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 16,
          }}>
            ✦ AI CORE · 핵심 기능
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 8 }}>
            계약서 AI 분석
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
            PDF 업로드 또는 텍스트 붙여넣기로 위험 조항을 18초 안에 확인하세요.
          </p>
        </div>

        {!result ? (
          <div style={{
            background: "#fff", border: "1.5px solid #e8f0fb",
            borderRadius: 20, padding: "32px",
            boxShadow: "0 4px 24px rgba(60,145,230,0.08)",
          }}>

            {/* 파일 업로드 영역 */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: dragOver ? "2px dashed #3C91E6" : "2px dashed #b3d4f5",
                borderRadius: 14,
                padding: "28px 20px",
                textAlign: "center",
                background: dragOver ? "#e8f3fd" : "#f8fbff",
                cursor: "pointer",
                transition: "all 0.15s",
                marginBottom: 16,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{(file.size / 1024).toFixed(1)}KB</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    style={{
                      background: "#fee2e2", border: "none", borderRadius: "50%",
                      width: 24, height: 24, cursor: "pointer", color: "#dc2626",
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📎</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    PDF, 이미지(JPG/PNG) 파일을 드래그하거나 클릭해서 업로드
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>최대 10MB</div>
                </>
              )}
            </div>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={e => handleFile(e.target.files?.[0])}
              style={{ position: "fixed", top: -9999, opacity: 0 }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => handleFile(e.target.files?.[0])}
              style={{ position: "fixed", top: -9999, opacity: 0 }}
            />

            {/* 카메라 버튼 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  flex: 1, padding: "10px", border: "1.5px solid #b3d4f5",
                  borderRadius: 10, background: "#e8f3fd", color: "#3C91E6",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                📷 카메라로 찍기
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1, padding: "10px", border: "1.5px solid #b3d4f5",
                  borderRadius: 10, background: "#e8f3fd", color: "#3C91E6",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                📁 파일 선택
              </button>
            </div>

            {/* 구분선 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#e8f0fb" }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>또는 직접 붙여넣기</span>
              <div style={{ flex: 1, height: 1, background: "#e8f0fb" }} />
            </div>

            {/* 텍스트 입력 */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="계약서 내용을 여기에 붙여넣으세요..."
              rows={8}
              style={{
                width: "100%", padding: "14px 16px", boxSizing: "border-box",
                border: "1.5px solid #b3d4f5", borderRadius: 12,
                fontSize: 14, fontFamily: "inherit", color: "#0f172a",
                outline: "none", resize: "vertical", lineHeight: 1.7,
                background: "#FAFFFD", transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = "#3C91E6"; e.target.style.boxShadow = "0 0 0 3px rgba(60,145,230,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#b3d4f5"; e.target.style.boxShadow = "none"; }}
            />

            {/* 에러 */}
            {error && (
              <div style={{
                margin: "12px 0 0", padding: "10px 14px",
                background: "#fff1f1", border: "1px solid #fca5a5",
                borderRadius: 8, fontSize: 13, color: "#dc2626",
              }}>
                {error}
              </div>
            )}

            {/* 분석 버튼 */}
            <button
              onClick={handleAnalyze}
              disabled={loading || (!text.trim() && !file)}
              style={{
                width: "100%", marginTop: 16, padding: "15px",
                background: loading || (!text.trim() && !file) ? "#94a3b8" : "#3C91E6",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: loading || (!text.trim() && !file) ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite", display: "inline-block",
                  }} />
                  분석 중...
                </>
              ) : (
                <>✦ 계약서 분석하기</>
              )}
            </button>

            {/* 신뢰 지표 */}
            <div style={{
              marginTop: 16, display: "flex", flexWrap: "wrap",
              gap: "6px 16px", justifyContent: "center",
            }}>
              {["업로드 파일 분석 후 즉시 삭제", "평균 18초 결과", "하루 1회 무료"].map(t => (
                <span key={t} style={{
                  fontSize: 11, color: "#94a3b8",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <svg width="11" height="11" fill="none" stroke="#3C91E6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* 결과 화면 */
          <div>
            {/* 결과 요약 헤더 */}
            <div style={{
              background: "#fff", border: "1.5px solid #e8f0fb",
              borderRadius: 16, padding: "24px", marginBottom: 16,
              boxShadow: "0 2px 12px rgba(60,145,230,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>분석 완료</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {result.contractType || "계약서"} 분석 결과
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.dangerCount > 0 && (
                    <span style={{
                      padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                      background: "#fff1f1", color: "#dc2626", border: "1px solid #fca5a5",
                    }}>위험 {result.dangerCount}건</span>
                  )}
                  {result.warnCount > 0 && (
                    <span style={{
                      padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                      background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a",
                    }}>주의 {result.warnCount}건</span>
                  )}
                  {result.safeCount > 0 && (
                    <span style={{
                      padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                      background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac",
                    }}>양호 {result.safeCount}건</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI 한줄 평가 */}
            {result.summary && (
              <div style={{
                background: "linear-gradient(135deg, #1d4ed8, #3C91E6)",
                borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                boxShadow: "0 4px 16px rgba(60,145,230,0.25)",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.06em" }}>
                  ✦ AI 한 줄 평가
                </div>
                <div style={{ fontSize: 15, color: "#fff", fontWeight: 600, lineHeight: 1.6 }}>
                  {result.summary}
                </div>
              </div>
            )}

            {/* 항목별 결과 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(result.items || []).map((item, i) => {
                const rc = RISK_COLORS[item.risk] || RISK_COLORS.info;
                return (
                  <div key={i} style={{
                    background: rc.bg, border: `1px solid ${rc.border}`,
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: rc.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: rc.text }}>{rc.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0, paddingLeft: 16 }}>
                      {item.desc}
                    </p>
                    {item.advice && (
                      <div style={{
                        marginTop: 8, paddingLeft: 16, paddingTop: 8,
                        borderTop: `1px solid ${rc.border}`,
                        fontSize: 12, color: rc.text, fontWeight: 600, lineHeight: 1.6,
                      }}>
                        💡 {item.advice}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 다시 분석 버튼 */}
            <button
              onClick={reset}
              style={{
                width: "100%", padding: "14px",
                background: "#fff", border: "1.5px solid #b3d4f5",
                borderRadius: 12, fontSize: 15, fontWeight: 700,
                color: "#3C91E6", cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              ← 다른 계약서 분석하기
            </button>
          </div>
        )}

        {/* 면책 고지 */}
        <div style={{
          marginTop: 32, padding: "14px 16px",
          background: "#f0f7ff", border: "1px solid #b3d4f5",
          borderRadius: 10, fontSize: 12, color: "#64748b", lineHeight: 1.7,
        }}>
          온변의 AI 분석 결과는 법적 효력이 없으며 참고 목적으로만 사용하세요.
          보증금 1억 원 이상 계약, 사업 관련 중요 계약은 변호사 상담을 병행하시길 권합니다.
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
