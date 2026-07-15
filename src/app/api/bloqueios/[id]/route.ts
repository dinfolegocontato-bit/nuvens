import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { erroResposta, erroInterno } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/bloqueios/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const existe = await prisma.bloqueio.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Bloqueio não encontrado.", 404);

    await prisma.bloqueio.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
