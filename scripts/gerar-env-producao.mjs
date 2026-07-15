// Gera os segredos de PRODUÇÃO para colar nas Environment Variables do Vercel.
// Uso: npm run env:producao "a-senha-da-mariana"
//
// Rode isso na SUA máquina: os valores aparecem só no seu terminal.
// Nunca cole a senha nem o AUTH_SECRET em chat, issue ou commit.
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const senha = process.argv[2];
if (!senha) {
  console.error('\nUso: npm run env:producao "a-senha-que-a-mariana-vai-usar"\n');
  process.exit(1);
}
if (senha.length < 8) {
  console.error("\nUse uma senha com pelo menos 8 caracteres.\n");
  process.exit(1);
}

const authSecret = crypto.randomBytes(32).toString("base64");
const hash = await bcrypt.hash(senha, 10);

console.log(`
┌──────────────────────────────────────────────────────────────┐
│  Cole estes valores nas Environment Variables do Vercel      │
└──────────────────────────────────────────────────────────────┘

AUTH_SECRET
${authSecret}

AUTH_PASSWORD_HASH
${hash}

Observações:
• No Vercel, cole os valores CRUS (sem aspas e sem escapar o "$").
  O escape "\\$" só é necessário no arquivo .env local, porque o Next
  expande variáveis ali.
• Guarde a senha em um gerenciador de senhas — o hash não volta pra senha.
• Não reaproveite o AUTH_SECRET de desenvolvimento em produção.
`);
