// Gera o hash bcrypt de uma senha para colar em AUTH_PASSWORD_HASH (.env)
// Uso: node scripts/gerar-hash.mjs "sua-senha"
import bcrypt from "bcryptjs";

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: node scripts/gerar-hash.mjs "sua-senha"');
  process.exit(1);
}

const hash = await bcrypt.hash(senha, 10);
// Escapa os "$" porque o Next.js expande variáveis no .env (dotenv-expand).
const hashEscapado = hash.replace(/\$/g, "\\$");
console.log("\nCopie para o seu .env (com os $ já escapados):\n");
console.log(`AUTH_PASSWORD_HASH="${hashEscapado}"\n`);
