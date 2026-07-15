import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { erroResposta, erroInterno } from "@/lib/api";
import { gerarCSV, numeroCSV, dataCSV, respostaCSV } from "@/lib/csv";
import { calcularFinanceiro } from "@/lib/financeiro-servico";
import { calcularHospedes } from "@/lib/hospedes-servico";
import { derivadosReserva } from "@/lib/metricas";
import { nomeMes } from "@/lib/formatters";

type Ctx = { params: Promise<{ tipo: string }> };

const TIPOS = ["reservas", "financeiro", "hospedes", "avaliacoes"] as const;
type Tipo = (typeof TIPOS)[number];

const ROTULO_PLATAFORMA: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRETO: "Direto",
};
const ROTULO_TIPO_RESERVA: Record<string, string> = {
  LAZER: "Lazer",
  TRABALHO: "Trabalho",
  LONGA_TEMPORADA: "Longa temporada",
  GRUPO: "Grupo",
};
const ROTULO_STATUS: Record<string, string> = {
  CONFIRMADA: "Confirmada",
  PENDENTE: "Pendente",
  CANCELADA: "Cancelada",
  ATIVO: "Ativo",
  FUTURO: "Futuro",
  CANCELADO: "Cancelado",
  PAGO: "Pago",
};

// GET /api/relatorios/[tipo]?mes=&ano=
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { tipo } = await params;
    if (!TIPOS.includes(tipo as Tipo)) {
      return erroResposta("TIPO_INVALIDO", "Relatório não encontrado.", 404);
    }

    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();
    const sufixo = `${String(mes).padStart(2, "0")}-${ano}`;

    if (tipo === "reservas") {
      const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
      const inicioProximo = new Date(Date.UTC(ano, mes, 1));
      const reservas = await prisma.reserva.findMany({
        where: { checkin: { lt: inicioProximo }, checkout: { gt: inicioMes } },
        orderBy: { checkin: "asc" },
        include: {
          hospede: { select: { nome: true, email: true } },
          imovel: { select: { nome: true, cidade: true } },
        },
      });

      const linhas = reservas.map((r) => {
        const d = derivadosReserva({
          valorDiaria: Number(r.valorDiaria),
          taxaLimpeza: Number(r.taxaLimpeza),
          taxasServicos: Number(r.taxasServicos),
          desconto: Number(r.desconto),
          taxaPlataformaPct: Number(r.taxaPlataformaPct),
          checkin: r.checkin,
          checkout: r.checkout,
          status: r.status,
        });
        return [
          r.hospede.nome,
          r.hospede.email ?? "",
          r.imovel.nome,
          r.imovel.cidade,
          ROTULO_PLATAFORMA[r.plataforma] ?? r.plataforma,
          ROTULO_TIPO_RESERVA[r.tipo] ?? r.tipo,
          ROTULO_STATUS[r.status] ?? r.status,
          dataCSV(r.checkin),
          dataCSV(r.checkout),
          d.noites,
          r.numeroHospedes,
          numeroCSV(Number(r.valorDiaria)),
          numeroCSV(Number(r.taxaLimpeza)),
          numeroCSV(Number(r.taxasServicos)),
          numeroCSV(Number(r.desconto)),
          numeroCSV(d.valorTotal),
          numeroCSV(Number(r.taxaPlataformaPct)),
          numeroCSV(d.valorLiquido),
          r.codigoExterno ?? "",
        ];
      });

      const csv = gerarCSV(
        [
          "Hóspede", "E-mail", "Chalé", "Cidade", "Plataforma", "Tipo", "Status",
          "Check-in", "Check-out", "Noites", "Hóspedes", "Valor diária",
          "Taxa de limpeza", "Taxas/serviços", "Desconto", "Valor total",
          "Taxa plataforma (%)", "Valor líquido", "Código",
        ],
        linhas
      );
      return respostaCSV(csv, `reservas-${sufixo}.csv`);
    }

    if (tipo === "financeiro") {
      const f = await calcularFinanceiro(mes, ano);
      const linhas = f.transacoes.map((t) => [
        dataCSV(t.data),
        t.descricao,
        t.categoria,
        t.origem ?? "",
        t.tipo === "ENTRADA" ? "Entrada" : "Saída",
        numeroCSV(t.valor),
        ROTULO_STATUS[t.status] ?? t.status,
        t.automatico ? "Automático" : "Manual",
      ]);

      // Resumo do período no fim do arquivo
      linhas.push([]);
      linhas.push(["Resumo do período", `${nomeMes(mes)}/${ano}`]);
      linhas.push(["Receita bruta", numeroCSV(f.kpis.receitaBruta)]);
      linhas.push(["Receita líquida", numeroCSV(f.kpis.receitaLiquida)]);
      linhas.push(["Gastos totais", numeroCSV(f.kpis.gastos)]);
      linhas.push(["Lucro líquido", numeroCSV(f.kpis.lucroLiquido)]);
      linhas.push(["Margem (%)", numeroCSV(f.kpis.margem)]);
      linhas.push(["Saldo atual", numeroCSV(f.fluxoCaixa.saldoAtual)]);

      const csv = gerarCSV(
        ["Data", "Descrição", "Categoria", "Fornecedor/Origem", "Tipo", "Valor", "Status", "Origem do lançamento"],
        linhas
      );
      return respostaCSV(csv, `financeiro-${sufixo}.csv`);
    }

    if (tipo === "hospedes") {
      const h = await calcularHospedes();
      const linhas = h.hospedes.map((x) => [
        x.nome,
        x.email ?? "",
        x.telefone ?? "",
        x.totalReservas,
        x.recorrente ? "Sim" : "Não",
        numeroCSV(x.totalGasto),
        x.ultimaEstadia ? dataCSV(x.ultimaEstadia.checkin) : "",
        x.ultimaEstadia ? dataCSV(x.ultimaEstadia.checkout) : "",
        x.ultimaEstadia?.imovelNome ?? "",
        x.ultimaEstadia ? ROTULO_PLATAFORMA[x.ultimaEstadia.plataforma] : "",
        ROTULO_STATUS[x.status] ?? x.status,
      ]);

      const csv = gerarCSV(
        [
          "Nome", "E-mail", "Telefone", "Nº de reservas", "Recorrente",
          "Total gasto", "Última estadia (check-in)", "Última estadia (check-out)",
          "Chalé", "Plataforma", "Status",
        ],
        linhas
      );
      return respostaCSV(csv, `hospedes-${sufixo}.csv`);
    }

    // avaliacoes
    const avaliacoes = await prisma.avaliacao.findMany({
      orderBy: { data: "desc" },
      include: { imovel: { select: { nome: true } } },
    });
    const linhas = avaliacoes.map((a) => [
      dataCSV(a.data),
      a.hospedeNome,
      a.imovel.nome,
      ROTULO_PLATAFORMA[a.plataforma] ?? a.plataforma,
      a.nota,
      a.comentario ?? "",
      a.respostaEnviada ?? "",
    ]);
    const csv = gerarCSV(
      ["Data", "Hóspede", "Chalé", "Plataforma", "Nota", "Comentário", "Resposta enviada"],
      linhas
    );
    return respostaCSV(csv, `avaliacoes-${sufixo}.csv`);
  } catch (e) {
    return erroInterno(e);
  }
}
