import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { avaliacaoCreateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";
import type { AvaliacaoDTO, AvaliacoesResposta } from "@/lib/tipos";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ComImovel = {
  id: string;
  imovelId: string;
  reservaId: string | null;
  hospedeNome: string;
  plataforma: "AIRBNB" | "BOOKING" | "DIRETO";
  nota: number;
  data: Date;
  comentario: string | null;
  respostaEnviada: string | null;
  imovel: { nome: string };
};

function paraDTO(a: ComImovel): AvaliacaoDTO {
  return {
    id: a.id,
    imovelId: a.imovelId,
    reservaId: a.reservaId,
    hospedeNome: a.hospedeNome,
    plataforma: a.plataforma,
    nota: a.nota,
    data: iso(a.data),
    comentario: a.comentario,
    respostaEnviada: a.respostaEnviada,
    imovelNome: a.imovel.nome,
  };
}

// GET /api/avaliacoes — lista + resumo com distribuição 5→1 (§6.9)
export async function GET() {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      orderBy: { data: "desc" },
      include: { imovel: { select: { nome: true } } },
    });

    const total = avaliacoes.length;
    const media =
      total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : null;

    const distribuicao = [5, 4, 3, 2, 1].map((nota) => {
      const quantidade = avaliacoes.filter((a) => a.nota === nota).length;
      return {
        nota,
        quantidade,
        pct: total > 0 ? (quantidade / total) * 100 : 0,
      };
    });

    const resposta: AvaliacoesResposta = {
      resumo: { media, total, distribuicao },
      avaliacoes: avaliacoes.map(paraDTO),
    };
    return NextResponse.json(resposta);
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/avaliacoes — registra avaliação
export async function POST(req: NextRequest) {
  try {
    const dados = avaliacaoCreateSchema.parse(await req.json());

    const imovel = await prisma.imovel.findUnique({ where: { id: dados.imovelId } });
    if (!imovel)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);

    const avaliacao = await prisma.avaliacao.create({
      data: {
        imovelId: dados.imovelId,
        reservaId: dados.reservaId || null,
        hospedeNome: dados.hospedeNome,
        plataforma: dados.plataforma,
        nota: dados.nota,
        data: new Date(dados.data + "T00:00:00.000Z"),
        comentario: dados.comentario ?? null,
        respostaEnviada: dados.respostaEnviada ?? null,
      },
      include: { imovel: { select: { nome: true } } },
    });

    return NextResponse.json(paraDTO(avaliacao), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
