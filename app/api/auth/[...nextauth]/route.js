import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin } from "../../../../lib/supabase";

/**
 * NextAuth 설정 — Google 로그인
 *
 * Vercel 환경변수:
 *   GOOGLE_CLIENT_ID      → Google Cloud Console에서 발급
 *   GOOGLE_CLIENT_SECRET  → Google Cloud Console에서 발급
 *   NEXTAUTH_SECRET       → openssl rand -base64 32 실행 결과
 *   NEXTAUTH_URL          → https://onbyun.vercel.app
 */

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  callbacks: {
    // ── 로그인 시 users 테이블에 유저 정보 저장/갱신 ──────────
    async signIn({ user, account }) {
      if (!user?.email) return false; // 이메일 없으면 로그인 거부

      try {
        const supabase = getSupabaseAdmin();

        // 먼저 기존 유저인지 확인
        const { data: existing } = await supabase
          .from("users")
          .select("id, is_new_user")
          .eq("id", user.id)
          .single();

        // upsert: 처음 로그인이면 INSERT, 이미 있으면 last_login만 갱신
        const { error } = await supabase.from("users").upsert(
          {
            id:              user.id,
            email:           user.email,
            name:            user.name ?? null,
            image:           user.image ?? null,
            provider:        account?.provider ?? "google",
            last_login:      new Date().toISOString(),
            // 신규 유저면 is_new_user=true, 기존 유저면 유지
            is_new_user:     existing ? existing.is_new_user : true,
            // plan, role은 DEFAULT 값('free', 'user') 유지 — 서버만 변경 가능
          },
          { onConflict: "id", ignoreDuplicates: false }
        );

        if (error) {
          console.error("[NextAuth] users upsert 오류:", error.message);
          // DB 오류여도 로그인은 허용 (서비스 가용성 우선)
        }
      } catch (e) {
        console.error("[NextAuth] signIn 콜백 오류:", e);
      }

      return true;
    },

    // ── JWT에 userId + plan + role + is_new_user 포함 ──────────────────────
    async jwt({ token, user, trigger }) {
      // 최초 로그인 시 user 객체 존재
      if (user) {
        token.userId = user.id;
      }

      // 세션 갱신 또는 최초 로그인 시 DB에서 조회
      if (user || trigger === "update") {
        try {
          const supabase = getSupabaseAdmin();
          const { data } = await supabase
            .from("users")
            .select("plan, role, is_new_user, nickname")
            .eq("id", token.userId ?? token.sub)
            .single();

          if (data) {
            token.plan        = data.plan        ?? "free";
            token.role        = data.role        ?? "user";
            token.isNewUser   = data.is_new_user ?? true;
            token.nickname    = data.nickname    ?? null;
          }
        } catch (e) {
          console.error("[NextAuth] jwt 조회 오류:", e);
          token.plan      = token.plan      ?? "free";
          token.role      = token.role      ?? "user";
          token.isNewUser = token.isNewUser ?? true;
        }
      }

      return token;
    },

    // ── 세션에 userId, plan, role, isNewUser, nickname 노출 ───────────────────────
    async session({ session, token }) {
      session.user.id        = token.userId    ?? token.sub;
      session.user.plan      = token.plan      ?? "free";
      session.user.role      = token.role      ?? "user";
      session.user.isNewUser = token.isNewUser ?? true;
      session.user.nickname  = token.nickname  ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/",
    error:  "/",
  },

  logger: {
    error(code) {
      console.error("[NextAuth Error]", code);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
