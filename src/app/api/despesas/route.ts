import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { despesaCreateSchema } from "@/lib/validators";
import { erroValidacao, erroInterno } from "@/lib/api";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function paraDTO(d: {
  id: string;
  imovelId: string | null;
  data: Date;
  descricao: string;
  categoria: string;
  fornecedor: string | null;
  tipo: "ENTRADA" | "SAIDA";
  valor: Prisma.Decimal;
  status: "PAGO" | "PENDENTE";
}) {
  return {
    id: d.id,
    imovelId: d.imovelId,
    data: iso(d.data),
    descricao: d.descricao,
    categoria: d.categoria,
    fornecedor: d.fornecedor,
    tipo: d.tipo,
    valor: Number(d.valor),
    status: d.status,
  };
}

// GET /api/despesas?mes=&ano=&status=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const mes = Number(sp.get("mes"));
    const ano = Number(sp.get("ano"));
    const status = sp.get("status");

    const where: Prisma.DespesaWhereInput = {};
    if (mes >= 1 && mes <= 12 && ano > 1900) {
      where.data = {
        gte: new Date(Date.UTC(ano, mes - 1, 1)),
        lt: new Date(Date.UTC(ano, mes, 1)),
      };
    }
    if (status) where.status = status as Prisma.DespesaWhereInput["status"];

    const despesas = await prisma.despesa.findMany({
      where,
      orderBy: { data: "desc" },
    });
    return NextResponse.json(despesas.map(paraDTO));
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/despesas — lançamento manual
export async function POST(req: NextRequest) {
  try {
    const dados = despesaCreateSchema.parse(await req.json());

    const despesa = await prisma.despesa.create({
      data: {
        data: new Date(dados.data + "T00:00:00.000Z"),
        descricao: dados.descricao,
        categoria: dados.categoria,
        fornecedor: dados.fornecedor ?? null,
        tipo: dados.tipo,
        valor: dados.valor,
        status: dados.status,
        imovelId: dados.imovelId || null,
      },
    });

    return NextResponse.json(paraDTO(despesa), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
