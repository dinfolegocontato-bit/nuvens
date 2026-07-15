import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import {
  metricasDoMes,
  mesAnterior,
  delta,
  noitesNoMes,
  diasNoMes,
  receitaLiquidaPorDia,
  type ReservaCalc,
  type DespesaCalc,
} from "@/lib/metricas";
import type { MetricasResposta, PlataformaValor } from "@/lib/tipos";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** soma acumulada */
function acumular(arr: number[]): number[] {
  let soma = 0;
  return arr.map((v) => (soma += v));
}

/** Calcula TODOS os KPIs do mês + séries/listas do dashboard + comparação com o mês anterior. */
export async function calcularMetricas(
  mes: number,
  ano: number
): Promise<MetricasResposta> {
  const ant = mesAnterior(mes, ano);

  const janelaInicio = new Date(Date.UTC(ant.ano, ant.mes - 1, 1));
  const janelaFim = new Date(Date.UTC(ano, mes, 1));
  const hoje = new Date();
  const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  const [imoveisAtivos, reservasRaw, despesasRaw, config, avaliacoes, chegadasRaw, contasRaw] =
    await Promise.all([
      prisma.imovel.findMany({
        where: { status: "ATIVO" },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),
      prisma.reserva.findMany({
        where: { checkin: { lt: janelaFim }, checkout: { gt: janelaInicio } },
        select: {
          imovelId: true,
          plataforma: true,
          checkin: true,
          checkout: true,
          status: true,
          valorDiaria: true,
          taxaLimpeza: true,
          taxasServicos: true,
          desconto: true,
          taxaPlataformaPct: true,
        },
      }),
      prisma.despesa.findMany({
        where: { data: { gte: janelaInicio, lt: janelaFim } },
        select: { data: true, tipo: true, valor: true },
      }),
      getConfig(),
      prisma.avaliacao.findMany({ select: { nota: true } }),
      // Próximas chegadas — não canceladas com check-in a partir de hoje
      prisma.reserva.findMany({
        where: { status: { not: "CANCELADA" }, checkin: { gte: hojeUTC } },
        orderBy: { checkin: "asc" },
        take: 5,
        include: {
          hospede: { select: { nome: true } },
          imovel: { select: { nome: true, fotoUrl: true } },
        },
      }),
      // Contas a pagar — despesas pendentes por vencimento
      prisma.despesa.findMany({
        where: { status: "PENDENTE" },
        orderBy: { data: "asc" },
        take: 8,
        select: { id: true, descricao: true, valor: true, data: true, status: true },
      }),
    ]);

  const nAtivos = imoveisAtivos.length;

  const reservas: (ReservaCalc & { imovelId: string; plataforma: PlataformaValor })[] =
    reservasRaw.map((r) => ({
      imovelId: r.imovelId,
      plataforma: r.plataforma,
      checkin: r.checkin,
      checkout: r.checkout,
      status: r.status,
      valorDiaria: Number(r.valorDiaria),
      taxaLimpeza: Number(r.taxaLimpeza),
      taxasServicos: Number(r.taxasServicos),
      desconto: Number(r.desconto),
      taxaPlataformaPct: Number(r.taxaPlataformaPct),
    }));

  const despesas: DespesaCalc[] = despesasRaw.map((d) => ({
    data: d.data,
    tipo: d.tipo,
    valor: Number(d.valor),
  }));

  const saldoInicialCaixa = Number(config.saldoInicialCaixa);

  const atual = metricasDoMes({ mes, ano, reservas, despesas, imoveisAtivos: nAtivos, saldoInicialCaixa });
  const anterior = metricasDoMes({
    mes: ant.mes, ano: ant.ano, reservas, despesas, imoveisAtivos: nAtivos, saldoInicialCaixa,
  });

  // Série de receita diária acumulada (atual vs anterior)
  const cumAtual = acumular(receitaLiquidaPorDia(reservas, mes, ano));
  const cumAnt = acumular(receitaLiquidaPorDia(reservas, ant.mes, ant.ano));
  const maxDias = Math.max(diasNoMes(mes, ano), diasNoMes(ant.mes, ant.ano));
  const receitaDiaria = Array.from({ length: maxDias }, (_, i) => ({
    dia: i + 1,
    atual: cumAtual[i] ?? cumAtual[cumAtual.length - 1] ?? 0,
    anterior: cumAnt[i] ?? cumAnt[cumAnt.length - 1] ?? 0,
  }));

  // Reservas do mês atual (intersectam), não canceladas
  const doMes = reservas.filter(
    (r) => r.status !== "CANCELADA" && noitesNoMes(r.checkin, r.checkout, mes, ano) > 0
  );

  // Reservas por plataforma (contagem)
  const contagem = new Map<PlataformaValor, number>();
  for (const r of doMes) contagem.set(r.plataforma, (contagem.get(r.plataforma) ?? 0) + 1);
  const reservasPorPlataforma = Array.from(contagem, ([plataforma, quantidade]) => ({
    plataforma,
    quantidade,
  }));

  // Ocupação por chalé
  const diasMes = diasNoMes(mes, ano);
  const ocupacaoPorChale = imoveisAtivos.map((im) => {
    const noitesChale = doMes
      .filter((r) => r.imovelId === im.id)
      .reduce((s, r) => s + noitesNoMes(r.checkin, r.checkout, mes, ano), 0);
    return {
      imovel: im.nome,
      ocupacao: diasMes > 0 ? (noitesChale / diasMes) * 100 : 0,
    };
  });

  const total = avaliacoes.length;
  const media = total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : null;

  return {
    mes,
    ano,
    atual,
    anterior,
    deltas: {
      receitaLiquida: delta(atual.receitaLiquida, anterior.receitaLiquida),
      receitaBruta: delta(atual.receitaBruta, anterior.receitaBruta),
      ocupacao: delta(atual.ocupacao, anterior.ocupacao),
      noitesVendidas: delta(atual.noitesVendidas, anterior.noitesVendidas),
      adr: delta(atual.adr, anterior.adr),
      revpar: delta(atual.revpar, anterior.revpar),
      lucroLiquido: delta(atual.lucroLiquido, anterior.lucroLiquido),
      gastos: delta(atual.gastos, anterior.gastos),
      margem: delta(atual.margem, anterior.margem),
    },
    avaliacao: { media, total },
    series: { receitaDiaria },
    reservasPorPlataforma,
    ocupacaoPorChale,
    proximasChegadas: chegadasRaw.map((r) => ({
      id: r.id,
      hospedeNome: r.hospede.nome,
      imovelNome: r.imovel.nome,
      imovelFoto: r.imovel.fotoUrl,
      checkin: iso(r.checkin),
      noites: Math.round(
        (r.checkout.getTime() - r.checkin.getTime()) / (24 * 60 * 60 * 1000)
      ),
    })),
    contasAPagar: contasRaw.map((d) => ({
      id: d.id,
      descricao: d.descricao,
      valor: Number(d.valor),
      data: iso(d.data),
      status: d.status,
    })),
  };
}
