import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // A lógica de autorização vive em authConfig.callbacks.authorized
  void req;
});

export const config = {
  // Protege tudo, menos assets estáticos e as rotas internas de auth
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
