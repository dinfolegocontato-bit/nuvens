import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { despesaUpdateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/despesas/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const dados = despesaUpdateSchema.parse(await req.json());

    const existe = await prisma.despesa.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Lançamento não encontrado.", 404);

    const despesa = await prisma.despesa.update({
      where: { id },
      data: {
        data: dados.data ? new Date(dados.data + "T00:00:00.000Z") : undefined,
        descricao: dados.descricao,
        categoria: dados.categoria,
        fornecedor: dados.fornecedor === undefined ? undefined : dados.fornecedor ?? null,
        tipo: dados.tipo,
        valor: dados.valor,
        status: dados.status,
        imovelId: dados.imovelId === undefined ? undefined : dados.imovelId || null,
      },
    });

    return NextResponse.json({
      id: despesa.id,
      imovelId: despesa.imovelId,
      data: despesa.data.toISOString().slice(0, 10),
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      fornecedor: despesa.fornecedor,
      tipo: despesa.tipo,
      valor: Number(despesa.valor),
      status: despesa.status,
    });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}

// DELETE /api/despesas/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const existe = await prisma.despesa.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Lançamento não encontrado.", 404);

    await prisma.despesa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
