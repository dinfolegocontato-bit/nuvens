import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { imovelUpdateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";
import { ZodError } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/imoveis/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const imovel = await prisma.imovel.findUnique({
      where: { id },
      include: { _count: { select: { reservas: true } } },
    });
    if (!imovel)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);
    return NextResponse.json(imovel);
  } catch (e) {
    return erroInterno(e);
  }
}

// PATCH /api/imoveis/[id] — edita
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const dados = imovelUpdateSchema.parse(body);

    const existe = await prisma.imovel.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);

    const imovel = await prisma.imovel.update({
      where: { id },
      data: {
        ...dados,
        fotoUrl: dados.fotoUrl === undefined ? undefined : dados.fotoUrl ?? null,
      },
    });
    return NextResponse.json(imovel);
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}

// DELETE /api/imoveis/[id] — bloqueado se houver reservas (RN07)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const existe = await prisma.imovel.findUnique({
      where: { id },
      include: { _count: { select: { reservas: true } } },
    });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);

    if (existe._count.reservas > 0) {
      return erroResposta(
        "TEM_RESERVAS",
        "Esse chalé tem reservas. Exclua as reservas antes.",
        409
      );
    }

    await prisma.imovel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
