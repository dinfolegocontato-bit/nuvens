import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";

const VERSAO = 1;

/**
 * "Seus dados" (PRD §6.12): exportar backup (JSON), restaurar e começar do zero.
 * Toda ação é disparada explicitamente pela Mariana na tela.
 */

// GET /api/backup — exporta tudo em JSON
export async function GET() {
  try {
    const [imoveis, hospedes, reservas, bloqueios, despesas, avaliacoes, config] =
      await Promise.all([
        prisma.imovel.findMany(),
        prisma.hospede.findMany(),
        prisma.reserva.findMany(),
        prisma.bloqueio.findMany(),
        prisma.despesa.findMany(),
        prisma.avaliacao.findMany(),
        prisma.config.findUnique({ where: { id: "singleton" } }),
      ]);

    const backup = {
      versao: VERSAO,
      geradoEm: new Date().toISOString(),
      dados: { imoveis, hospedes, reservas, bloqueios, despesas, avaliacoes, config },
    };

    const nome = `morada-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return erroInterno(e);
  }
}

const backupSchema = z.object({
  versao: z.number(),
  dados: z.object({
    imoveis: z.array(z.record(z.unknown())),
    hospedes: z.array(z.record(z.unknown())),
    reservas: z.array(z.record(z.unknown())),
    bloqueios: z.array(z.record(z.unknown())),
    despesas: z.array(z.record(z.unknown())),
    avaliacoes: z.array(z.record(z.unknown())),
    config: z.record(z.unknown()).nullable().optional(),
  }),
});

/** Limpa tudo respeitando as dependências (avaliações → reservas → hóspedes/imóveis). */
async function limparTudo(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  await tx.avaliacao.deleteMany();
  await tx.bloqueio.deleteMany();
  await tx.despesa.deleteMany();
  await tx.reserva.deleteMany();
  await tx.hospede.deleteMany();
  await tx.imovel.deleteMany();
}

// POST /api/backup — restaura um backup (substitui os dados atuais)
export async function POST(req: NextRequest) {
  try {
    const body = backupSchema.parse(await req.json());
    if (body.versao !== VERSAO) {
      return erroResposta(
        "VERSAO_INCOMPATIVEL",
        `Este backup é da versão ${body.versao}; o sistema espera a versão ${VERSAO}.`,
        422
      );
    }

    const d = body.dados;

    /** Reidrata os campos de data (JSON traz string ISO) e devolve o objeto pronto. */
    const comDatas = (
      obj: Record<string, unknown>,
      campos: string[]
    ): Record<string, unknown> => {
      const saida: Record<string, unknown> = { ...obj };
      for (const c of campos) {
        if (typeof saida[c] === "string") saida[c] = new Date(saida[c] as string);
      }
      return saida;
    };

    await prisma.$transaction(async (tx) => {
      await limparTudo(tx);
      // Ordem importa: imóveis e hóspedes antes das reservas (chaves estrangeiras).
      for (const i of d.imoveis)
        await tx.imovel.create({ data: comDatas(i, ["criadoEm"]) as never });
      for (const h of d.hospedes)
        await tx.hospede.create({ data: comDatas(h, ["criadoEm"]) as never });
      for (const r of d.reservas)
        await tx.reserva.create({
          data: comDatas(r, ["checkin", "checkout", "criadoEm"]) as never,
        });
      for (const b of d.bloqueios)
        await tx.bloqueio.create({
          data: comDatas(b, ["inicio", "fim", "criadoEm"]) as never,
        });
      for (const x of d.despesas)
        await tx.despesa.create({ data: comDatas(x, ["data", "criadoEm"]) as never });
      for (const a of d.avaliacoes)
        await tx.avaliacao.create({ data: comDatas(a, ["data", "criadoEm"]) as never });
      if (d.config)
        await tx.config.upsert({
          where: { id: "singleton" },
          create: { ...d.config, id: "singleton" } as never,
          update: { ...d.config } as never,
        });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}

// DELETE /api/backup — "Começar do zero" (a tela exige dupla confirmação)
export async function DELETE() {
  try {
    await prisma.$transaction(async (tx) => {
      await limparTudo(tx);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
