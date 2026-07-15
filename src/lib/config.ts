import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Busca (ou cria com os defaults do PRD §3) o registro único de CONFIG. */
export async function getConfig() {
  const existente = await prisma.config.findUnique({ where: { id: "singleton" } });
  if (existente) return existente;
  return prisma.config.create({ data: { id: "singleton" } });
}

/** Taxa da plataforma (%) segundo a CONFIG — copiada na criação da reserva (PRD §3). */
export function taxaDaPlataforma(
  config: { taxaAirbnbPct: Prisma.Decimal; taxaBookingPct: Prisma.Decimal; taxaDiretoPct: Prisma.Decimal },
  plataforma: "AIRBNB" | "BOOKING" | "DIRETO"
): number {
  const mapa = {
    AIRBNB: config.taxaAirbnbPct,
    BOOKING: config.taxaBookingPct,
    DIRETO: config.taxaDiretoPct,
  };
  return Number(mapa[plataforma]);
}
