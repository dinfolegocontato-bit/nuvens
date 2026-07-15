import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { bloqueioCreateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// GET /api/bloqueios?imovelId=&mes=&ano=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const imovelId = sp.get("imovelId") ?? undefined;
    const mes = Number(sp.get("mes"));
    const ano = Number(sp.get("ano"));

    const where: { imovelId?: string; inicio?: object; fim?: object } = {};
    if (imovelId) where.imovelId = imovelId;
    if (mes >= 1 && mes <= 12 && ano > 1900) {
      where.inicio = { lt: new Date(Date.UTC(ano, mes, 1)) };
      where.fim = { gte: new Date(Date.UTC(ano, mes - 1, 1)) };
    }

    const bloqueios = await prisma.bloqueio.findMany({
      where,
      orderBy: { inicio: "asc" },
    });
    return NextResponse.json(
      bloqueios.map((b) => ({
        id: b.id,
        imovelId: b.imovelId,
        motivo: b.motivo,
        inicio: iso(b.inicio),
        fim: iso(b.fim),
        nota: b.nota,
      }))
    );
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/bloqueios — cria bloqueio/manutenção
export async function POST(req: NextRequest) {
  try {
    const dados = bloqueioCreateSchema.parse(await req.json());

    const imovel = await prisma.imovel.findUnique({ where: { id: dados.imovelId } });
    if (!imovel)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);

    const inicio = new Date(dados.inicio + "T00:00:00.000Z");
    const fimExclusivo = new Date(
      new Date(dados.fim + "T00:00:00.000Z").getTime() + 24 * 60 * 60 * 1000
    );

    // Guarda de integridade: não bloquear datas que já têm reserva não cancelada
    const conflito = await prisma.reserva.findFirst({
      where: {
        imovelId: dados.imovelId,
        status: { not: "CANCELADA" },
        checkin: { lt: fimExclusivo },
        checkout: { gt: inicio },
      },
      include: { hospede: { select: { nome: true } } },
    });
    if (conflito) {
      return erroResposta(
        "TEM_RESERVA",
        `Essas datas já têm a reserva de ${conflito.hospede.nome}. Cancele-a antes de bloquear.`,
        409
      );
    }

    const bloqueio = await prisma.bloqueio.create({
      data: {
        imovelId: dados.imovelId,
        motivo: dados.motivo,
        inicio,
        fim: new Date(dados.fim + "T00:00:00.000Z"),
        nota: dados.nota ?? null,
      },
    });

    return NextResponse.json(
      {
        id: bloqueio.id,
        imovelId: bloqueio.imovelId,
        motivo: bloqueio.motivo,
        inicio: iso(bloqueio.inicio),
        fim: iso(bloqueio.fim),
        nota: bloqueio.nota,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
