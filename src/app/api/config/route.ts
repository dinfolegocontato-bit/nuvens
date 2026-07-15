import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { erroValidacao, erroInterno } from "@/lib/api";
import { z, ZodError } from "zod";

const taxa = z.coerce.number().min(0).max(100);

const configUpdateSchema = z.object({
  saldoInicialCaixa: z.coerce.number().optional(),
  taxaAirbnbPct: taxa.optional(),
  taxaBookingPct: taxa.optional(),
  taxaDiretoPct: taxa.optional(),
});

// GET /api/config
export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
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
    return NextResponse.json(config);
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
