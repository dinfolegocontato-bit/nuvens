import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// Usuária única (Mariana) — vem do ambiente, nunca do banco.
const AUTH_EMAIL = process.env.AUTH_EMAIL ?? "";
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credenciaisSchema.safeParse(credentials);
        if (!parsed.success) return null;
        if (!AUTH_EMAIL || !AUTH_PASSWORD_HASH) return null;

        const { email, senha } = parsed.data;
        if (email.toLowerCase() !== AUTH_EMAIL.toLowerCase()) return null;

        const confere = await bcrypt.compare(senha, AUTH_PASSWORD_HASH);
        if (!confere) return null;

        return {
          id: "mariana",
          name: "Mariana Ferraz",
          email: AUTH_EMAIL,
        };
      },
    }),
  ],
});
