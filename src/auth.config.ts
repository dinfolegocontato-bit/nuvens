import type { NextAuthConfig } from "next-auth";

/**
 * Config compartilhada — SEM dependências node-only (bcrypt).
 * É o que o middleware (edge) importa, então só cuida de sessão e proteção de rota.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // preenchido em auth.ts (roda no servidor Node)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user;
      const emLogin = nextUrl.pathname.startsWith("/login");

      if (emLogin) {
        // já logada tentando ver /login → manda pro painel
        if (logado) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // qualquer outra rota exige login
      return logado;
    },
  },
} satisfies NextAuthConfig;
