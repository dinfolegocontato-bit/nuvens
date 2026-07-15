import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { reservaUpdateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";
import { verificarDisponibilidade } from "@/lib/disponibilidade";
import { reservaParaDTO, RESERVA_INCLUDE } from "@/lib/serializers";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/reservas/[id] — edita, cancela ou muda status
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const dados = reservaUpdateSchema.parse(await req.json());

    const atual = await prisma.reserva.findUnique({ where: { id } });
    if (!atual)
      return erroResposta("NAO_ENCONTRADO", "Reserva não encontrada.", 404);

    const novoStatus = dados.status ?? atual.status;
    const novoCheckin = dados.checkin
      ? new Date(dados.checkin + "T00:00:00.000Z")
      : atual.checkin;
    const novoCheckout = dados.checkout
      ? new Date(dados.checkout + "T00:00:00.000Z")
      : atual.checkout;

    // RN01/RN02 — se mexeu nas datas e não está cancelando, revalida disponibilidade
    const mudouDatas = !!dados.checkin || !!dados.checkout;
    if (mudouDatas && novoStatus !== "CANCELADA") {
      const { livre, conflitos } = await verificarDisponibilidade({
        imovelId: atual.imovelId,
        checkin: novoCheckin.toISOString().slice(0, 10),
        checkout: novoCheckout.toISOString().slice(0, 10),
        ignorarReservaId: id,
      });
      if (!livre) {
        const temBloqueio = conflitos.some((c) => c.tipo !== "RESERVA");
        const mensagem = temBloqueio
          ? "Essas datas estão bloqueadas. Libere o bloqueio no calendário antes de reservar."
          : "Esse chalé já tem reserva nessas datas.";
        return NextResponse.json(
          { erro: { codigo: "CONFLITO", mensagem, campos: { checkout: mensagem } }, conflitos },
          { status: 409 }
        );
      }
    }

    const atualizada = await prisma.reserva.update({
      where: { id },
      data: {
        plataforma: dados.plataforma,
        tipo: dados.tipo,
        status: dados.status,
        codigoExterno: dados.codigoExterno ?? undefined,
        checkin: dados.checkin ? novoCheckin : undefined,
        checkout: dados.checkout ? novoCheckout : undefined,
        numeroHospedes: dados.numeroHospedes,
        valorDiaria: dados.valorDiaria,
        taxaLimpeza: dados.taxaLimpeza,
        taxasServicos: dados.taxasServicos,
        desconto: dados.desconto,
        observacoes: dados.observacoes ?? undefined,
      },
      include: RESERVA_INCLUDE,
    });

    return NextResponse.json(reservaParaDTO(atualizada));
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}

// DELETE /api/reservas/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const existe = await prisma.reserva.findUnique({ where: { id } });
    if (!existe)
      return erroResposta("NAO_ENCONTRADO", "Reserva não encontrada.", 404);

    await prisma.reserva.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroInterno(e);
  }
}
