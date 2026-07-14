import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { imovelCreateSchema } from "@/lib/validators";
import { erroValidacao, erroInterno } from "@/lib/api";
import { ZodError } from "zod";

// GET /api/imoveis — lista os chalés (com contagem de reservas para RN07)
export async function GET() {
  try {
    const imoveis = await prisma.imovel.findMany({
      orderBy: [{ status: "asc" }, { nome: "asc" }],
      include: { _count: { select: { reservas: true } } },
    });
    return NextResponse.json(imoveis);
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/imoveis — cria um chalé
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dados = imovelCreateSchema.parse(body);

    const imovel = await prisma.imovel.create({
      data: {
        nome: dados.nome,
        cidade: dados.cidade,
        status: dados.status,
        capacidade: dados.capacidade,
        quartos: dados.quartos,
        banheiros: dados.banheiros,
        fotoUrl: dados.fotoUrl ?? null,
        plataformas: dados.plataformas,
      },
    });

    return NextResponse.json(imovel, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
