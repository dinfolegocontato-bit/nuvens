import type { Prisma } from "@prisma/client";
import { derivadosReserva } from "@/lib/metricas";
import type { ReservaDTO } from "@/lib/tipos";

type ReservaComRelacoes = Prisma.ReservaGetPayload<{
  include: {
    hospede: { select: { id: true; nome: true; email: true } };
    imovel: { select: { id: true; nome: true; cidade: true; fotoUrl: true } };
  };
}>;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Converte uma reserva do Prisma para o DTO da API, já com os derivados. */
export function reservaParaDTO(r: ReservaComRelacoes): ReservaDTO {
  const valores = {
    valorDiaria: Number(r.valorDiaria),
    taxaLimpeza: Number(r.taxaLimpeza),
    taxasServicos: Number(r.taxasServicos),
    desconto: Number(r.desconto),
    taxaPlataformaPct: Number(r.taxaPlataformaPct),
    checkin: r.checkin,
    checkout: r.checkout,
    status: r.status,
  };
  const d = derivadosReserva(valores);

  return {
    id: r.id,
    imovelId: r.imovelId,
    hospedeId: r.hospedeId,
    plataforma: r.plataforma,
    tipo: r.tipo,
    status: r.status,
    codigoExterno: r.codigoExterno,
    checkin: iso(r.checkin),
    checkout: iso(r.checkout),
    numeroHospedes: r.numeroHospedes,
    valorDiaria: Number(r.valorDiaria),
    taxaLimpeza: Number(r.taxaLimpeza),
    taxasServicos: Number(r.taxasServicos),
    desconto: Number(r.desconto),
    taxaPlataformaPct: Number(r.taxaPlataformaPct),
    observacoes: r.observacoes,
    criadoEm: r.criadoEm.toISOString(),
    hospede: r.hospede,
    imovel: r.imovel,
    noites: d.noites,
    valorTotal: d.valorTotal,
    valorLiquido: d.valorLiquido,
  };
}

export const RESERVA_INCLUDE = {
  hospede: { select: { id: true, nome: true, email: true } },
  imovel: { select: { id: true, nome: true, cidade: true, fotoUrl: true } },
} satisfies Prisma.ReservaInclude;
