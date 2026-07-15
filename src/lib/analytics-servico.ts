import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import {
  metricasDoMes,
  mesAnterior,
  delta,
  noites,
  noitesNoMes,
  diasNoMes,
  paraDataUTC,
  valorTotalReserva,
  receitaLiquidaPorDia,
  type ReservaCalc,
  type DespesaCalc,
} from "@/lib/metricas";
import { nomeMes } from "@/lib/formatters";
import type { AnalyticsResposta, PlataformaValor } from "@/lib/tipos";

const MS_DIA = 24 * 60 * 60 * 1000;
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function deslocarMes(mes: number, ano: number, d: number) {
  const zero = ano * 12 + (mes - 1) + d;
  return { mes: (zero % 12) + 1, ano: Math.floor(zero / 12) };
}
function acumular(arr: number[]): number[] {
  let s = 0;
  return arr.map((v) => (s += v));
}

export async function calcularAnalytics(
  mes: number,
  ano: number
): Promise<AnalyticsResposta> {
  const ant = mesAnterior(mes, ano);

  // Janela: 6 meses para trás até o fim do mês selecionado
  const inicioSeis = deslocarMes(mes, ano, -5);
  const janelaInicio = new Date(Date.UTC(inicioSeis.ano, inicioSeis.mes - 1, 1));
  const janelaFim = new Date(Date.UTC(ano, mes, 1));

  const [imoveisAtivos, reservasRaw, despesasRaw, config, avaliacoes] =
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
          criadoEm: true,
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

  const nAtivos = imoveisAtivos.length;

  const reservas: (ReservaCalc & {
    imovelId: string;
    plataforma: PlataformaValor;
    criadoEm: Date;
  })[] = reservasRaw.map((r) => ({
    imovelId: r.imovelId,
    plataforma: r.plataforma,
    criadoEm: r.criadoEm,
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

  const base = {
    reservas,
    despesas,
    imoveisAtivos: nAtivos,
    saldoInicialCaixa: Number(config.saldoInicialCaixa),
  };
  const atual = metricasDoMes({ mes, ano, ...base });
  const anterior = metricasDoMes({ mes: ant.mes, ano: ant.ano, ...base });

  // Série de 6 meses (para sparklines e comparativo)
  const seisMeses = Array.from({ length: 6 }, (_, i) => {
    const p = deslocarMes(mes, ano, -(5 - i));
    const m = metricasDoMes({ mes: p.mes, ano: p.ano, ...base });
    return {
      rotulo: `${nomeMes(p.mes).slice(0, 3)}/${String(p.ano).slice(2)}`,
      mes: p.mes,
      ano: p.ano,
      m,
    };
  });

  // Reservas do mês (não canceladas, que tocam o mês)
  const doMes = reservas.filter(
    (r) => r.status !== "CANCELADA" && noitesNoMes(r.checkin, r.checkout, mes, ano) > 0
  );

  // Desempenho por plataforma (receita bruta rateada)
  const receitaPlat = new Map<PlataformaValor, number>();
  for (const r of doMes) {
    const nTot = noites(r.checkin, r.checkout);
    const fracao = nTot > 0 ? noitesNoMes(r.checkin, r.checkout, mes, ano) / nTot : 0;
    receitaPlat.set(
      r.plataforma,
      (receitaPlat.get(r.plataforma) ?? 0) + valorTotalReserva(r) * fracao
    );
  }
  const totalPlat = Array.from(receitaPlat.values()).reduce((a, b) => a + b, 0);
  const desempenhoPorPlataforma = Array.from(receitaPlat, ([plataforma, receita]) => ({
    plataforma,
    receita,
    pct: totalPlat > 0 ? (receita / totalPlat) * 100 : 0,
  })).sort((a, b) => b.receita - a.receita);

  // Distribuição por canal (contagem)
  const contagem = new Map<PlataformaValor, number>();
  for (const r of doMes) contagem.set(r.plataforma, (contagem.get(r.plataforma) ?? 0) + 1);
  const distribuicaoPorCanal = Array.from(contagem, ([plataforma, quantidade]) => ({
    plataforma,
    quantidade,
  }));

  // Ocupação por imóvel: mês atual vs anterior
  const diasAtual = diasNoMes(mes, ano);
  const diasAnterior = diasNoMes(ant.mes, ant.ano);
  const ocupacaoPorImovel = imoveisAtivos.map((im) => {
    const nAtual = reservas
      .filter((r) => r.status !== "CANCELADA" && r.imovelId === im.id)
      .reduce((s, r) => s + noitesNoMes(r.checkin, r.checkout, mes, ano), 0);
    const nAnt = reservas
      .filter((r) => r.status !== "CANCELADA" && r.imovelId === im.id)
      .reduce((s, r) => s + noitesNoMes(r.checkin, r.checkout, ant.mes, ant.ano), 0);
    return {
      imovel: im.nome,
      atual: diasAtual > 0 ? (nAtual / diasAtual) * 100 : 0,
      anterior: diasAnterior > 0 ? (nAnt / diasAnterior) * 100 : 0,
    };
  });

  // Antecedência média (check-in − criação da reserva), em dias
  const antecedenciaDe = (lista: typeof reservas) => {
    const dias = lista.map((r) => {
      const ci = paraDataUTC(r.checkin).getTime();
      const criado = paraDataUTC(r.criadoEm).getTime();
      return Math.max(0, Math.round((ci - criado) / MS_DIA));
    });
    return dias.length > 0 ? dias.reduce((a, b) => a + b, 0) / dias.length : 0;
  };
  const noMesPorCheckin = (m: number, a: number) =>
    reservas.filter((r) => {
      const ci = paraDataUTC(r.checkin);
      return (
        r.status !== "CANCELADA" &&
        ci.getUTCFullYear() === a &&
        ci.getUTCMonth() === m - 1
      );
    });
  const antecedencia = {
    mediaDias: antecedenciaDe(noMesPorCheckin(mes, ano)),
    serie: seisMeses.map((s) => ({
      rotulo: s.rotulo,
      dias: antecedenciaDe(noMesPorCheckin(s.mes, s.ano)),
    })),
  };

  // Dias da semana mais reservados (por noite ocupada no mês)
  const contagemDia = new Array(7).fill(0);
  for (const r of doMes) {
    const nTot = noites(r.checkin, r.checkout);
    let t = paraDataUTC(r.checkin).getTime();
    const mInicio = Date.UTC(ano, mes - 1, 1);
    const mFim = Date.UTC(ano, mes, 1);
    for (let i = 0; i < nTot; i++) {
      if (t >= mInicio && t < mFim) contagemDia[new Date(t).getUTCDay()] += 1;
      t += MS_DIA;
    }
  }
  const totalNoites = contagemDia.reduce((a: number, b: number) => a + b, 0);
  const diasSemana = DIAS_SEMANA.map((dia, i) => ({
    dia,
    quantidade: contagemDia[i],
    pct: totalNoites > 0 ? (contagemDia[i] / totalNoites) * 100 : 0,
  }));

  // Melhor desempenho (chalé com maior receita no período)
  const receitaPorImovel = imoveisAtivos.map((im) => {
    const receita = doMes
      .filter((r) => r.imovelId === im.id)
      .reduce((s, r) => {
        const nTot = noites(r.checkin, r.checkout);
        const fracao = nTot > 0 ? noitesNoMes(r.checkin, r.checkout, mes, ano) / nTot : 0;
        return s + valorTotalReserva(r) * fracao;
      }, 0);
    const oc = ocupacaoPorImovel.find((o) => o.imovel === im.nome)?.atual ?? 0;
    return { imovel: im.nome, receita, ocupacao: oc };
  });
  const melhorDesempenho =
    receitaPorImovel.length > 0
      ? receitaPorImovel.reduce((a, b) => (b.receita > a.receita ? b : a))
      : null;

  const totalAval = avaliacoes.length;
  const mediaAval =
    totalAval > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / totalAval : null;

  const cumAtual = acumular(receitaLiquidaPorDia(reservas, mes, ano));
  const cumAnt = acumular(receitaLiquidaPorDia(reservas, ant.mes, ant.ano));
  const maxDias = Math.max(diasAtual, diasAnterior);

  return {
    mes,
    ano,
    kpis: {
      receitaTotal: atual.receitaBruta,
      ocupacao: atual.ocupacao,
      noitesVendidas: atual.noitesVendidas,
      adr: atual.adr,
      revpar: atual.revpar,
      avaliacaoMedia: mediaAval,
      totalAvaliacoes: totalAval,
    },
    deltas: {
      receitaTotal: delta(atual.receitaBruta, anterior.receitaBruta),
      ocupacao: delta(atual.ocupacao, anterior.ocupacao),
      noitesVendidas: delta(atual.noitesVendidas, anterior.noitesVendidas),
      adr: delta(atual.adr, anterior.adr),
      revpar: delta(atual.revpar, anterior.revpar),
    },
    sparklines: {
      receitaTotal: seisMeses.map((s) => ({ v: s.m.receitaBruta })),
      ocupacao: seisMeses.map((s) => ({ v: s.m.ocupacao })),
      noitesVendidas: seisMeses.map((s) => ({ v: s.m.noitesVendidas })),
      adr: seisMeses.map((s) => ({ v: s.m.adr })),
      revpar: seisMeses.map((s) => ({ v: s.m.revpar })),
    },
    receitaAoLongo: Array.from({ length: maxDias }, (_, i) => ({
      dia: i + 1,
      atual: cumAtual[i] ?? cumAtual[cumAtual.length - 1] ?? 0,
      anterior: cumAnt[i] ?? cumAnt[cumAnt.length - 1] ?? 0,
    })),
    desempenhoPorPlataforma,
    distribuicaoPorCanal,
    ocupacaoPorImovel,
    antecedencia,
    diasSemana,
    comparativoMensal: seisMeses.map((s) => ({
      rotulo: s.rotulo,
      receita: s.m.receitaBruta,
      ocupacao: s.m.ocupacao,
    })),
    melhorDesempenho,
    semDados: doMes.length === 0,
  };
}
