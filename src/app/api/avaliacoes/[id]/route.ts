import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { avaliacaoUpdateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/avaliacoes/[id] — editar / salvar resposta enviada
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const dados = avaliacaoUpdateSchema.parse(await req.json());

    const existe = await prisma.avaliacao.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Avaliação não encontrada.", 404);

    const a = await prisma.avaliacao.update({
      where: { id },
      data: {
        imovelId: dados.imovelId,
        hospedeNome: dados.hospedeNome,
        plataforma: dados.plataforma,
        nota: dados.nota,
        data: dados.data ? new Date(dados.data + "T00:00:00.000Z") : undefined,
        comentario: dados.comentario === undefined ? undefined : dados.comentario ?? null,
        respostaEnviada:
          dados.respostaEnviada === undefined ? undefined : dados.respostaEnviada ?? null,
      },
      include: { imovel: { select: { nome: true } } },
    });

    return NextResponse.json({
      id: a.id,
      imovelId: a.imovelId,
      reservaId: a.reservaId,
      hospedeNome: a.hospedeNome,
      plataforma: a.plataforma,
      nota: a.nota,
      data: a.data.toISOString().slice(0, 10),
      comentario: a.comentario,
      respostaEnviada: a.respostaEnviada,
      imovelNome: a.imovel.nome,
    });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}

// DELETE /api/avaliacoes/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const existe = await prisma.avaliacao.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Avaliação não encontrada.", 404);

    await prisma.avaliacao.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
