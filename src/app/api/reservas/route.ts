import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { reservaCreateSchema } from "@/lib/validators";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";
import { getConfig, taxaDaPlataforma } from "@/lib/config";
import { verificarDisponibilidade } from "@/lib/disponibilidade";
import { reservaParaDTO, RESERVA_INCLUDE } from "@/lib/serializers";

const POR_PAGINA = 10;

// GET /api/reservas?mes=&ano=&status=&imovelId=&plataforma=&q=&pagina=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const mes = Number(sp.get("mes"));
    const ano = Number(sp.get("ano"));
    const status = sp.get("status");
    const imovelId = sp.get("imovelId");
    const plataforma = sp.get("plataforma");
    const q = sp.get("q")?.trim();
    const pagina = Math.max(1, Number(sp.get("pagina")) || 1);

    const where: Prisma.ReservaWhereInput = {};

    // Período (RN08) — reservas que intersectam o mês selecionado
    if (mes >= 1 && mes <= 12 && ano > 1900) {
      const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
      const inicioProximo = new Date(Date.UTC(ano, mes, 1));
      where.checkin = { lt: inicioProximo };
      where.checkout = { gt: inicioMes };
    }

    if (status) where.status = status as Prisma.ReservaWhereInput["status"];
    if (imovelId) where.imovelId = imovelId;
    if (plataforma)
      where.plataforma = plataforma as Prisma.ReservaWhereInput["plataforma"];
    if (q) {
      where.OR = [
        { hospede: { nome: { contains: q, mode: "insensitive" } } },
        { hospede: { email: { contains: q, mode: "insensitive" } } },
        { imovel: { nome: { contains: q, mode: "insensitive" } } },
        { codigoExterno: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, reservas] = await Promise.all([
      prisma.reserva.count({ where }),
      prisma.reserva.findMany({
        where,
        include: RESERVA_INCLUDE,
        orderBy: { checkin: "asc" },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
    ]);

    return NextResponse.json({
      reservas: reservas.map(reservaParaDTO),
      total,
      pagina,
      porPagina: POR_PAGINA,
      totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    });
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/reservas — cria (upsert hóspede + insere reserva, em transação)
export async function POST(req: NextRequest) {
  try {
    const dados = reservaCreateSchema.parse(await req.json());

    // RN04 — só chalé ATIVO recebe reserva
    const imovel = await prisma.imovel.findUnique({
      where: { id: dados.imovelId },
    });
    if (!imovel)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);
    if (imovel.status !== "ATIVO")
      return erroResposta(
        "IMOVEL_INATIVO",
        "Só chalés ativos podem receber reservas.",
        409
      );

    // RN01/RN02 — disponibilidade
    const { livre, conflitos } = await verificarDisponibilidade({
      imovelId: dados.imovelId,
      checkin: dados.checkin,
      checkout: dados.checkout,
    });
    if (!livre) {
      const temBloqueio = conflitos.some((c) => c.tipo !== "RESERVA");
      const mensagem = temBloqueio
        ? "Essas datas estão bloqueadas. Libere o bloqueio no calendário antes de reservar."
        : "Esse chalé já tem reserva nessas datas.";
      return NextResponse.json(
        { erro: { codigo: "CONFLITO", mensagem, campos: { checkin: mensagem } }, conflitos },
        { status: 409 }
      );
    }

    // Taxa da plataforma copiada da CONFIG no momento da criação (PRD §3)
    const config = await getConfig();
    const taxaPlataformaPct = taxaDaPlataforma(config, dados.plataforma);

    const criada = await prisma.$transaction(async (tx) => {
      // RN06 — hóspede por e-mail: vincula se existe, senão cria
      let hospedeId: string;
      const email = dados.hospede.email?.toLowerCase();
      const existente = email
        ? await tx.hospede.findUnique({ where: { email } })
        : null;

      if (existente) {
        hospedeId = existente.id;
      } else {
        const novo = await tx.hospede.create({
          data: {
            nome: dados.hospede.nome,
            email: email ?? null,
            telefone: dados.hospede.telefone ?? null,
            documento: dados.hospede.documento ?? null,
            observacoes: dados.hospede.observacoes ?? null,
          },
        });
        hospedeId = novo.id;
      }

      return tx.reserva.create({
        data: {
          imovelId: dados.imovelId,
          hospedeId,
          plataforma: dados.plataforma,
          tipo: dados.tipo,
          status: dados.status,
          codigoExterno: dados.codigoExterno ?? null,
          checkin: new Date(dados.checkin + "T00:00:00.000Z"),
          checkout: new Date(dados.checkout + "T00:00:00.000Z"),
          numeroHospedes: dados.numeroHospedes,
          valorDiaria: dados.valorDiaria,
          taxaLimpeza: dados.taxaLimpeza,
          taxasServicos: dados.taxasServicos,
          desconto: dados.desconto,
          taxaPlataformaPct,
          observacoes: dados.observacoes ?? null,
        },
        include: RESERVA_INCLUDE,
      });
    });

    return NextResponse.json(reservaParaDTO(criada), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
