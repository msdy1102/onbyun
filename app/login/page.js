"use client";
import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // 이미 로그인된 경우 → callbackUrl로 이동
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.isNewUser) {
        router.replace("/onboarding");
      } else {
        router.replace(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  if (status === "loading") {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FAFFFD" }}>
        <div style={{ width:32, height:32, border:"3px solid #b3d4f5", borderTopColor:"#3C91E6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#f0f7ff",
      fontFamily:"'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif",
      display:"flex", flexDirection:"column",
    }}>
      {/* 헤더 */}
      <header style={{ background:"#fff", borderBottom:"1px solid #e8f0fb", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 24px", height:56, display:"flex", alignItems:"center" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, background:"#3C91E6", color:"#fff", borderRadius:7, fontSize:12, fontWeight:700 }}>온</span>
            <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>온변</span>
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
        <div style={{
          background:"#fff", border:"1.5px solid #e8f3fd", borderRadius:24,
          padding:"40px 36px", width:"100%", maxWidth:420,
          boxShadow:"0 8px 40px rgba(60,145,230,0.12)",
        }}>
          {/* 로고 */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              width:56, height:56, background:"linear-gradient(135deg, #1d4ed8, #3C91E6)",
              borderRadius:16, fontSize:22, fontWeight:700, color:"#fff",
              marginBottom:16, boxShadow:"0 4px 16px rgba(60,145,230,0.3)",
            }}>온</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginBottom:6, letterSpacing:"-0.3px" }}>온변에 오신 것을 환영해요</h1>
            <p style={{ fontSize:14, color:"#64748b", lineHeight:1.6 }}>
              Google 계정으로 시작하세요<br/>
              AI 계약서 분석을 하루 1회 무료로 이용할 수 있어요
            </p>
          </div>

          {/* 혜택 목록 */}
          <div style={{
            background:"#e8f3fd", border:"1px solid #b3d4f5",
            borderRadius:12, padding:"14px 18px", marginBottom:28,
            display:"flex", flexDirection:"column", gap:10,
          }}>
            {[
              { icon:"📋", text:"121종 계약서 체크리스트 무료" },
              { icon:"✦",  text:"AI 계약서 분석 하루 1회 무료" },
              { icon:"🏛️", text:"정부지원 서류 안내 무료" },
              { icon:"🧮", text:"법률 계산기 무료" },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, color:"#1e3a5f", fontWeight:500 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* Google 로그인 버튼 */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            style={{
              width:"100%", padding:"14px 20px", borderRadius:12,
              background:"#fff", border:"1.5px solid #e2e8f0",
              display:"flex", alignItems:"center", justifyContent:"center", gap:12,
              fontSize:15, fontWeight:700, color:"#0f172a", cursor:"pointer",
              fontFamily:"inherit", transition:"all 0.15s",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#3C91E6"; e.currentTarget.style.boxShadow="0 4px 16px rgba(60,145,230,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)"; }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google로 시작하기
          </button>

          {/* 법적 고지 */}
          <p style={{ textAlign:"center", fontSize:12, color:"#94a3b8", marginTop:16, lineHeight:1.7 }}>
            로그인 시{" "}
            <Link href="/terms" target="_blank" style={{ color:"#3C91E6", textDecoration:"none" }}>이용약관</Link>
            {" "}및{" "}
            <Link href="/privacy" target="_blank" style={{ color:"#3C91E6", textDecoration:"none" }}>개인정보처리방침</Link>
            에 동의합니다.
          </p>

          {/* 홈으로 */}
          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link href="/" style={{ fontSize:13, color:"#94a3b8", textDecoration:"none" }}>
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ borderTop:"1px solid #e8f0fb", padding:"16px 24px", background:"#fff", textAlign:"center" }}>
        <p style={{ fontSize:12, color:"#94a3b8" }}>© 2025 온변(Onbyun). All rights reserved.</p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
