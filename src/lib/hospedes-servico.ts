import { prisma } from "@/lib/prisma";
import { noites, valorTotalReserva } from "@/lib/metricas";
import type { HospedesResposta, PlataformaValor } from "@/lib/tipos";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Base de hóspedes com agregados (PRD §6.7).
 * A base é cumulativa (um hóspede não "some" ao trocar o mês) e o rótulo
 * Recorrente segue a RN06: a partir da 2ª reserva não cancelada.
 */
export async function calcularHospedes(): Promise<HospedesResposta> {
  const hoje = new Date();
  const hojeISO = iso(
    new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))
  );

  const [hospedesRaw, avaliacoes] = await Promise.all([
    prisma.hospede.findMany({
      orderBy: { nome: "asc" },
      include: {
        reservas: {
          include: { imovel: { select: { nome: true } } },
          orderBy: { checkin: "desc" },
        },
      },
    }),
    prisma.avaliacao.findMany({ select: { nota: true } }),
  ]);

  const hospedes = hospedesRaw.map((h) => {
    const naoCanceladas = h.reservas.filter((r) => r.status !== "CANCELADA");
    const ultima = naoCanceladas[0]; // já ordenadas por checkin desc

    const totalGasto = naoCanceladas.reduce(
      (s, r) =>
        s +
        valorTotalReserva({
          valorDiaria: Number(r.valorDiaria),
          taxaLimpeza: Number(r.taxaLimpeza),
          taxasServicos: Number(r.taxasServicos),
          desconto: Number(r.desconto),
          checkin: r.checkin,
          checkout: r.checkout,
        }),
      0
    );

    // Status derivado do estado das reservas do hóspede
    let status: "ATIVO" | "FUTURO" | "CANCELADO";
    if (naoCanceladas.length === 0) status = "CANCELADO";
    else if (naoCanceladas.some((r) => iso(r.checkin) > hojeISO)) status = "FUTURO";
    else status = "ATIVO";

    return {
      id: h.id,
      nome: h.nome,
      email: h.email,
      telefone: h.telefone,
      totalReservas: naoCanceladas.length,
      recorrente: naoCanceladas.length >= 2, // RN06
      totalGasto,
      status,
      ultimaEstadia: ultima
        ? {
            checkin: iso(ultima.checkin),
            checkout: iso(ultima.checkout),
            noites: noites(ultima.checkin, ultima.checkout),
            imovelNome: ultima.imovel.nome,
            plataforma: ultima.plataforma as PlataformaValor,
          }
        : null,
    };
  });

  // Origem por plataforma (última reserva de cada hóspede)
  const origemMap = new Map<PlataformaValor, number>();
  for (const h of hospedes) {
    if (!h.ultimaEstadia) continue;
    const p = h.ultimaEstadia.plataforma;
    origemMap.set(p, (origemMap.get(p) ?? 0) + 1);
  }

  const totalAval = avaliacoes.length;
  const mediaAval =
    totalAval > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / totalAval : null;

  // Próximas chegadas
  const proximasRaw = await prisma.reserva.findMany({
    where: { status: { not: "CANCELADA" }, checkin: { gte: new Date(hojeISO) } },
    orderBy: { checkin: "asc" },
    take: 5,
    include: {
      hospede: { select: { nome: true } },
      imovel: { select: { nome: true } },
    },
  });

  return {
    kpis: {
      total: hospedes.length,
      novos: hospedes.filter((h) => !h.recorrente).length,
      recorrentes: hospedes.filter((h) => h.recorrente).length,
      avaliacaoMedia: mediaAval,
      totalAvaliacoes: totalAval,
    },
    hospedes,
    origemPorPlataforma: Array.from(origemMap, ([plataforma, quantidade]) => ({
      plataforma,
      quantidade,
    })),
    recorrentesTop3: hospedes
      .filter((h) => h.recorrente)
      .sort((a, b) => b.totalGasto - a.totalGasto)
      .slice(0, 3)
      .map((h) => ({ id: h.id, nome: h.nome, totalGasto: h.totalGasto })),
    proximasChegadas: proximasRaw.map((r) => ({
      id: r.id,
      hospedeNome: r.hospede.nome,
      imovelNome: r.imovel.nome,
      checkin: iso(r.checkin),
    })),
  };
}
