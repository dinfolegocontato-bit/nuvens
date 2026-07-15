# Morada nas Nuvens — PMS

Sistema de gestão da pousada **Morada nas Nuvens** (Visconde de Mauá, RJ).
Lançamento manual de reservas, despesas e avaliações, com painéis de desempenho
e um assistente de IA que lê os dados e sugere ações.

Implementado a partir do `PRD-morada-nas-nuvens.md` — que continua sendo a fonte da verdade.

## Regras inegociáveis do projeto

1. **Sem dados mockados.** O banco nasce vazio; toda linha aparece porque a Mariana cadastrou.
   Não existe seed de demonstração, array hardcoded nem `faker` no repositório.
2. **Sem `localStorage` como banco.** Persistência é PostgreSQL via Prisma.
3. **Manual por design.** Nenhum job/cron/integração de reservas no v1.
4. **Métrica nenhuma é calculada no cliente.** Tudo sai de `lib/metricas.ts` via `/api/metricas`.
5. **`ANTHROPIC_API_KEY` só no servidor** (`lib/anthropic.ts` importa `server-only`).
6. **Português do Brasil**, moeda BRL, datas `dd/mm/aaaa`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · Recharts · Prisma + PostgreSQL
· Zod + react-hook-form · TanStack Query · Auth.js · Anthropic API (`claude-sonnet-4-6`)

## Rodando local

Requisitos: Node 20+ e um PostgreSQL acessível.

```bash
npm install
cp .env.example .env      # preencha as variáveis (veja abaixo)
npx prisma migrate dev    # cria o schema (o banco começa VAZIO)
npm run dev               # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | PostgreSQL (Docker local ou Neon) |
| `AUTH_SECRET` | segredo do Auth.js (qualquer string longa e aleatória) |
| `AUTH_EMAIL` | e-mail da usuária única (Mariana) |
| `AUTH_PASSWORD_HASH` | hash bcrypt da senha — gere com `npm run gerar-hash "sua-senha"` |
| `ANTHROPIC_API_KEY` | opcional; sem ela as telas funcionam, só a IA fica desligada |

> ⚠️ **Escape os `$` do hash bcrypt** no `.env` (`\$2a\$10\$...`). O Next expande variáveis
> no `.env` e um `$` não escapado corrompe o hash. O `npm run gerar-hash` já emite escapado.

### Testes

```bash
npm test        # regras de cálculo de lib/metricas.ts (22 testes)
```

Cobrem ocupação, ADR, RevPAR, receita líquida, recorte de reserva que atravessa o mês,
reserva cancelada, gastos, deltas e bordas (fevereiro bissexto, virada de ano).

## Deploy (Vercel + Neon)

1. **Banco (Neon):** crie um projeto, copie a connection string (com `?sslmode=require`).
2. **Vercel:** importe o repositório e configure as variáveis de ambiente da tabela acima
   (`DATABASE_URL` apontando para o Neon).
3. **Migrations:** o `build` roda `prisma generate`. Aplique o schema no banco de produção com:
   ```bash
   DATABASE_URL="<url-do-neon>" npx prisma migrate deploy
   ```
4. **`AUTH_SECRET`:** gere um novo para produção — não reaproveite o de desenvolvimento.
5. Confirme que `ANTHROPIC_API_KEY` está só nas variáveis do servidor (nunca com prefixo `NEXT_PUBLIC_`).

## Estrutura

```
src/
  app/(auth)/login          · login (usuária única, credenciais via env)
  app/(app)/…               · as 10 telas, dentro do shell (Sidebar + Topbar)
  app/api/…                 · Route Handlers (reservas, métricas, financeiro, IA, relatórios…)
  components/               · layout, ui (shadcn), kpi, reservas, calendario, financeiro, ia…
  lib/metricas.ts           · TODA a regra de cálculo (única fonte da verdade, testada)
  lib/anthropic.ts          · cliente da IA, server-only
prisma/schema.prisma        · modelo de dados (PRD §3)
```
