import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import {
  metricasDoMes,
  mesAnterior,
  delta,
  type ReservaCalc,
  type DespesaCalc,
} from "@/lib/metricas";
import type { MetricasResposta } from "@/lib/tipos";

/** Calcula TODOS os KPIs do mês + comparação com o mês anterior (PRD §3, §9). */
export async function calcularMetricas(
  mes: number,
  ano: number
): Promise<MetricasResposta> {
  const ant = mesAnterior(mes, ano);

  // Janela que cobre o mês atual e o anterior
  const janelaInicio = new Date(Date.UTC(ant.ano, ant.mes - 1, 1));
  const janelaFim = new Date(Date.UTC(ano, mes, 1)); // 1º dia do mês seguinte ao atual

  const [imoveisAtivos, reservasRaw, despesasRaw, config, avaliacoes] =
    await Promise.all([
      prisma.imovel.count({ where: { status: "ATIVO" } }),
      prisma.reserva.findMany({
        where: { checkin: { lt: janelaFim }, checkout: { gt: janelaInicio } },
        select: {
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
    ]);

  const reservas: ReservaCalc[] = reservasRaw.map((r) => ({
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

  const atual = metricasDoMes({
    mes, ano, reservas, despesas, imoveisAtivos, saldoInicialCaixa,
  });
  const anterior = metricasDoMes({
    mes: ant.mes, ano: ant.ano, reservas, despesas, imoveisAtivos, saldoInicialCaixa,
  });

  const total = avaliacoes.length;
  const media =
    total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : null;

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
  };
}
