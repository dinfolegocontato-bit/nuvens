import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { iaConfigurada } from "@/lib/anthropic";
import { erroValidacao, erroInterno } from "@/lib/api";
import { z, ZodError } from "zod";

const taxa = z.coerce.number().min(0).max(100);

const configUpdateSchema = z.object({
  saldoInicialCaixa: z.coerce.number().optional(),
  taxaAirbnbPct: taxa.optional(),
  taxaBookingPct: taxa.optional(),
  taxaDiretoPct: taxa.optional(),
});

/**
 * Prisma serializa Decimal como STRING no JSON. O ConfigDTO promete number, e o
 * cálculo do resumo ao vivo do wizard descarta não-números (viraria taxa 0%).
 * Converte aqui para o contrato bater com o tipo.
 */
function configParaDTO(c: {
  id: string;
  saldoInicialCaixa: Prisma.Decimal;
  taxaAirbnbPct: Prisma.Decimal;
  taxaBookingPct: Prisma.Decimal;
  taxaDiretoPct: Prisma.Decimal;
}) {
  return {
    id: c.id,
    saldoInicialCaixa: Number(c.saldoInicialCaixa),
    taxaAirbnbPct: Number(c.taxaAirbnbPct),
    taxaBookingPct: Number(c.taxaBookingPct),
    taxaDiretoPct: Number(c.taxaDiretoPct),
  };
}

// GET /api/config
export async function GET() {
  try {
    const config = await getConfig();
    // iaConfigurada é só um booleano — a chave em si nunca sai do servidor (PRD §1)
    return NextResponse.json({
      ...configParaDTO(config),
      iaConfigurada: iaConfigurada(),
    });
  } catch (e) {
    return erroInterno(e);
  }
}

// PATCH /api/config — taxas das plataformas e saldo inicial (usado em Integrações)
export async function PATCH(req: NextRequest) {
  try {
    await getConfig(); // garante o singleton
    const dados = configUpdateSchema.parse(await req.json());
    const config = await prisma.config.update({
      where: { id: "singleton" },
      data: dados,
    });
    return NextResponse.json({
      ...configParaDTO(config),
      iaConfigurada: iaConfigurada(),
    });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
