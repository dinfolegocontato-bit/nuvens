import { prisma } from "@/lib/prisma";
import { paraDataUTC } from "@/lib/metricas";

export interface Conflito {
  tipo: "RESERVA" | "BLOQUEIO" | "MANUTENCAO";
  id: string;
  descricao: string;
  inicio: string;
  fim: string;
}

/**
 * Verifica se um chalé está livre para o período (RN01 reservas, RN02 bloqueios).
 * Datas em "yyyy-mm-dd". `ignorarReservaId` exclui a própria reserva ao editar.
 * Noites da reserva: [checkin, checkout). Bloqueio: [inicio, fim] inclusive.
 */
export async function verificarDisponibilidade(params: {
  imovelId: string;
  checkin: string;
  checkout: string;
  ignorarReservaId?: string;
}): Promise<{ livre: boolean; conflitos: Conflito[] }> {
  const { imovelId, checkin, checkout, ignorarReservaId } = params;
  const ci = paraDataUTC(checkin);
  const co = paraDataUTC(checkout);

  // RN01 — reservas não canceladas que se sobrepõem: existe.checkin < novo.checkout && existe.checkout > novo.checkin
  const reservas = await prisma.reserva.findMany({
    where: {
      imovelId,
      status: { not: "CANCELADA" },
      id: ignorarReservaId ? { not: ignorarReservaId } : undefined,
      checkin: { lt: co },
      checkout: { gt: ci },
    },
    include: { hospede: { select: { nome: true } } },
  });

  // RN02 — bloqueios que cobrem alguma noite: bloqueio.inicio < checkout && bloqueio.fim >= checkin
  const bloqueios = await prisma.bloqueio.findMany({
    where: {
      imovelId,
      inicio: { lt: co },
      fim: { gte: ci },
    },
  });

  const conflitos: Conflito[] = [
    ...reservas.map((r) => ({
      tipo: "RESERVA" as const,
      id: r.id,
      descricao: `Reserva de ${r.hospede.nome}`,
      inicio: r.checkin.toISOString().slice(0, 10),
      fim: r.checkout.toISOString().slice(0, 10),
    })),
    ...bloqueios.map((b) => ({
      tipo: (b.motivo === "MANUTENCAO" ? "MANUTENCAO" : "BLOQUEIO") as
        | "BLOQUEIO"
        | "MANUTENCAO",
      id: b.id,
      descricao: b.nota ?? (b.motivo === "MANUTENCAO" ? "Manutenção" : "Bloqueio"),
      inicio: b.inicio.toISOString().slice(0, 10),
      fim: b.fim.toISOString().slice(0, 10),
    })),
  ];

  return { livre: conflitos.length === 0, conflitos };
}
