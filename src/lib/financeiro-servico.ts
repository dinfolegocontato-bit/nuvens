import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import {
  metricasDoMes,
  mesAnterior,
  delta,
  noites,
  noitesNoMes,
  valorLiquidoReserva,
  type ReservaCalc,
  type DespesaCalc,
} from "@/lib/metricas";
import { nomeMes } from "@/lib/formatters";
import type {
  FinanceiroResposta,
  PlataformaValor,
  PontoEvolucao,
  TransacaoDTO,
} from "@/lib/tipos";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** desloca mes/ano por N meses (delta pode ser negativo). */
function deslocarMes(mes: number, ano: number, d: number) {
  const zero = ano * 12 + (mes - 1) + d;
  return { mes: (zero % 12) + 1, ano: Math.floor(zero / 12) };
}

export async function calcularFinanceiro(
  mes: number,
  ano: number
): Promise<FinanceiroResposta> {
  const ant = mesAnterior(mes, ano);

  // Janela cobrindo: mês anterior, últimos 6 meses e o ano inteiro selecionado
  const inicioSeis = deslocarMes(mes, ano, -5);
  const candidatosInicio = [
    Date.UTC(ano, 0, 1),
    Date.UTC(inicioSeis.ano, inicioSeis.mes - 1, 1),
    Date.UTC(ant.ano, ant.mes - 1, 1),
  ];
  const candidatosFim = [Date.UTC(ano + 1, 0, 1), Date.UTC(ano, mes, 1)];
  const janelaInicio = new Date(Math.min(...candidatosInicio));
  const janelaFim = new Date(Math.max(...candidatosFim));

  const [imoveisAtivos, reservasRaw, despesasRaw, config, contasRaw] =
    await Promise.all([
      prisma.imovel.count({ where: { status: "ATIVO" } }),
      prisma.reserva.findMany({
        where: { checkin: { lt: janelaFim }, checkout: { gt: janelaInicio } },
        include: {
          hospede: { select: { nome: true } },
          imovel: { select: { nome: true } },
        },
      }),
      prisma.despesa.findMany({
        where: { data: { gte: janelaInicio, lt: janelaFim } },
        orderBy: { data: "desc" },
      }),
      getConfig(),
      prisma.despesa.findMany({
        where: { status: "PENDENTE" },
        orderBy: { data: "asc" },
      }),
    ]);

  const reservas: (ReservaCalc & {
    plataforma: PlataformaValor;
    hospedeNome: string;
    imovelNome: string;
    id: string;
  })[] = reservasRaw.map((r) => ({
    id: r.id,
    plataforma: r.plataforma,
    hospedeNome: r.hospede.nome,
    imovelNome: r.imovel.nome,
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
  const base = { reservas, despesas, imoveisAtivos, saldoInicialCaixa };

  const atual = metricasDoMes({ mes, ano, ...base });
  const anterior = metricasDoMes({ mes: ant.mes, ano: ant.ano, ...base });

  // Evolução
  const ponto = (m: number, a: number): PontoEvolucao => {
    const x = metricasDoMes({ mes: m, ano: a, ...base });
    return {
      rotulo: `${nomeMes(m).slice(0, 3)}/${String(a).slice(2)}`,
      mes: m,
      ano: a,
      receitaLiquida: x.receitaLiquida,
      gastos: x.gastos,
      lucro: x.lucroLiquido,
    };
  };
  const evolucaoSeisMeses = Array.from({ length: 6 }, (_, i) => {
    const p = deslocarMes(mes, ano, -(5 - i));
    return ponto(p.mes, p.ano);
  });
  const evolucaoAno = Array.from({ length: 12 }, (_, i) => ponto(i + 1, ano));

  // Gastos por categoria (SAIDA do mês)
  const noMes = (d: Date) =>
    d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1;
  const saidasMes = despesasRaw.filter((d) => d.tipo === "SAIDA" && noMes(d.data));
  const porCategoria = new Map<string, number>();
  for (const d of saidasMes)
    porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + Number(d.valor));
  const totalGastos = Array.from(porCategoria.values()).reduce((a, b) => a + b, 0);
  const gastosPorCategoria = Array.from(porCategoria, ([categoria, valor]) => ({
    categoria,
    valor,
    pct: totalGastos > 0 ? (valor / totalGastos) * 100 : 0,
  })).sort((a, b) => b.valor - a.valor);

  // Resumo por plataforma (receita líquida rateada no mês)
  const porPlataforma = new Map<PlataformaValor, number>();
  for (const r of reservas) {
    if (r.status === "CANCELADA") continue;
    const nMes = noitesNoMes(r.checkin, r.checkout, mes, ano);
    if (nMes <= 0) continue;
    const nTot = noites(r.checkin, r.checkout);
    const fracao = nTot > 0 ? nMes / nTot : 0;
    porPlataforma.set(
      r.plataforma,
      (porPlataforma.get(r.plataforma) ?? 0) + valorLiquidoReserva(r) * fracao
    );
  }
  const totalPlat = Array.from(porPlataforma.values()).reduce((a, b) => a + b, 0);
  const resumoPorPlataforma = Array.from(porPlataforma, ([plataforma, receita]) => ({
    plataforma,
    receita,
    pct: totalPlat > 0 ? (receita / totalPlat) * 100 : 0,
  })).sort((a, b) => b.receita - a.receita);

  // Transações: entradas automáticas (reservas confirmadas com check-in no mês) + saídas manuais
  const entradas: TransacaoDTO[] = reservas
    .filter((r) => {
      const ci = new Date(r.checkin as Date);
      return r.status === "CONFIRMADA" && noMes(ci);
    })
    .map((r) => ({
      id: `reserva-${r.id}`,
      data: iso(r.checkin as Date),
      descricao: `Reserva · ${r.hospedeNome}`,
      categoria: "Reserva",
      origem: r.imovelNome,
      tipo: "ENTRADA" as const,
      valor: valorLiquidoReserva(r),
      status: "PAGO" as const,
      automatico: true,
    }));

  const saidas: TransacaoDTO[] = despesasRaw
    .filter((d) => noMes(d.data))
    .map((d) => ({
      id: d.id,
      data: iso(d.data),
      descricao: d.descricao,
      categoria: d.categoria,
      origem: d.fornecedor,
      tipo: d.tipo,
      valor: Number(d.valor),
      status: d.status,
      automatico: false,
    }));

  const transacoes = [...entradas, ...saidas].sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  return {
    mes,
    ano,
    kpis: {
      receitaLiquida: atual.receitaLiquida,
      receitaBruta: atual.receitaBruta,
      gastos: atual.gastos,
      lucroLiquido: atual.lucroLiquido,
      margem: atual.margem,
    },
    deltas: {
      receitaLiquida: delta(atual.receitaLiquida, anterior.receitaLiquida),
      receitaBruta: delta(atual.receitaBruta, anterior.receitaBruta),
      gastos: delta(atual.gastos, anterior.gastos),
      lucroLiquido: delta(atual.lucroLiquido, anterior.lucroLiquido),
      margem: delta(atual.margem, anterior.margem),
    },
    evolucaoSeisMeses,
    evolucaoAno,
    gastosPorCategoria,
    fluxoCaixa: {
      saldoInicial: saldoInicialCaixa,
      entradas: atual.receitaLiquida,
      saidas: atual.gastos,
      saldoAtual: atual.saldoCaixa,
    },
    resumoPorPlataforma,
    transacoes,
    contasAPagar: contasRaw.map((d) => ({
      id: d.id,
      imovelId: d.imovelId,
      data: iso(d.data),
      descricao: d.descricao,
      categoria: d.categoria,
      fornecedor: d.fornecedor,
      tipo: d.tipo,
      valor: Number(d.valor),
      status: d.status,
    })),
  };
}
