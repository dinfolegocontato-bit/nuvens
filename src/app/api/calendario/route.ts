import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { erroInterno } from "@/lib/api";
import { valorTotalReserva } from "@/lib/metricas";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// GET /api/calendario?mes=&ano= — imóveis + reservas + bloqueios que tocam o mês
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();

    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
    const inicioProximo = new Date(Date.UTC(ano, mes, 1));

    const [imoveis, reservas, bloqueios] = await Promise.all([
      // ATIVOS e FUTUROS aparecem no calendário (RN04: futuro como linha vazia)
      prisma.imovel.findMany({
        where: { status: { in: ["ATIVO", "FUTURO"] } },
        select: { id: true, nome: true, capacidade: true, fotoUrl: true, status: true },
        orderBy: [{ status: "asc" }, { nome: "asc" }],
      }),
      prisma.reserva.findMany({
        where: { checkin: { lt: inicioProximo }, checkout: { gt: inicioMes } },
        include: { hospede: { select: { nome: true } } },
      }),
      prisma.bloqueio.findMany({
        where: { inicio: { lt: inicioProximo }, fim: { gte: inicioMes } },
      }),
    ]);

    return NextResponse.json({
      mes,
      ano,
      imoveis,
      reservas: reservas.map((r) => ({
        id: r.id,
        imovelId: r.imovelId,
        hospedeNome: r.hospede.nome,
        plataforma: r.plataforma,
        status: r.status,
        checkin: iso(r.checkin),
        checkout: iso(r.checkout),
        numeroHospedes: r.numeroHospedes,
        valorTotal: valorTotalReserva({
          valorDiaria: Number(r.valorDiaria),
          taxaLimpeza: Number(r.taxaLimpeza),
          taxasServicos: Number(r.taxasServicos),
          desconto: Number(r.desconto),
          checkin: r.checkin,
          checkout: r.checkout,
        }),
      })),
      bloqueios: bloqueios.map((b) => ({
        id: b.id,
        imovelId: b.imovelId,
        motivo: b.motivo,
        inicio: iso(b.inicio),
        fim: iso(b.fim),
        nota: b.nota,
      })),
    });
  } catch (e) {
    return erroInterno(e);
  }
}
